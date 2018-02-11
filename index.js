var trace = document.querySelector('#trace')
var bg = document.querySelector('#bg')
var paint = document.querySelector('#paint')
var cols = document.querySelector('#cols')
var rows = document.querySelector('#rows')
var grid = document.querySelector('#grid')
var reset = document.querySelector('#reset')
var text = document.querySelector('#text')
var megamoji = document.querySelector('#megamoji')
var textarea = document.querySelector('#textarea')
var twemojiButton = document.querySelector('#twemoji')
var nativeButton = document.querySelector('#native')

var emojiData = null

var containerWidthInEm = 30 // .measure

fetch('./node_modules/emojilib/emojis.json').then(function(res) {
  return res.json()
}).then(useEmojiData)
function useEmojiData(json) {
  emojiData = json
  window.keywordToEmojiMap = {}

  for(var key in json) {

    if(json[key]['category'] === '_custom') continue

    var keywords = [key].concat(json[key].keywords)

    addEmojiToKeywordsMap(json[key]['char'], keywords)

    if(json[key]['fitzpatrick_scale']) {
      // Okay, so here's a thing. Emoji math is weird:
      // For plain skintone emoji like 🙌, 🙌 + 🏻 always equals 🙌🏻
      // For complex skintone emoji that also have genders, 🙇‍♀️ + 🏻 does not join.
      // Thankfully, array spreads can blow up the emoji for us, and we can
      // replace the skintone in the emoji sequence directly.
      const blownUp = [...json[key]['char']]

      // Add a placeholder for where the skintone goes. Yeah, it seems to go
      // here and yeah, it might break in the future.
      blownUp.splice(1, 0, '')
      for(const skintone of ["🏻", "🏼", "🏽", "🏾", "🏿"]) {
        blownUp[1] = skintone
        const withSkintone = blownUp.join('')
        addEmojiToKeywordsMap(withSkintone, keywords)
      }
    }
  }
}

trace.addEventListener('change', setTraceBackground)
cols.addEventListener('change', changeGrid)
rows.addEventListener('change', changeGrid)
paint.addEventListener('input', showEmojiPicker)
bg.addEventListener('input', showEmojiPicker)

nativeButton.addEventListener('change', function() {
  // Undo all the twemojifying.
  var els = grid.querySelectorAll('.target')
  for (var i = 0; i < els.length; i++) {
    // Twemoji inserts an image with the original emoji as an alt.
    els[i].textContent = els[i].children[0].alt
  }
})
twemojiButton.addEventListener('change', function() {
  twemoji.parse(grid)
})
reset.addEventListener('click', function() {
  changeGrid()
  setTraceBackground()
  textarea.hidden = true
  if (twemojiButton.checked) {
    twemoji.parse(grid)
  }
})
grid.addEventListener('click', function(event) {
  var cell = event.target

  // If you used the keyboard instead of clicking, then the target
  // is actually the button, not the div.
  if (cell.localName === 'button') {
    cell = cell.children[0]
  }

  var clearCell
  if (twemojiButton.checked) {
    // In Twemoji land, just replace the existing image with the twemoji image
    clearCell = cell.alt !== bg.value
    var newImg = clearCell ? twemoji.parse(bg.value) : twemoji.parse(paint.value)
    cell.parentElement.innerHTML = newImg
  } else {
    clearCell = cell.textContent !== bg.value
    cell.textContent = clearCell ? bg.value : paint.value
  }
})

text.addEventListener('click', function() {
  var useTwemoji = twemojiButton.checked
  var result = ''
  for(var i = 0; i < rows.value * cols.value; i++) {
    result += useTwemoji ? grid.children[i].querySelector('img').alt
                         : grid.children[i].textContent.trim()
    if (i % cols.value === cols.value - 1 && i !== rows.value * cols.value - 1) result += '\n'
  }
  fillTextarea(result)
})

megamoji.addEventListener('click', function() {
  var result = {emoji: [], pattern: ""}
  var useTwemoji = twemojiButton.checked
  for(var i = 0; i < rows.value * cols.value; i++) {
    var emoji = useTwemoji ? grid.children[i].querySelector('img').alt
                           : grid.children[i].textContent.trim()
    var text = `:${Object.keys(emojiData).filter(function(key) { return emojiData[key]['char'] === emoji })[0]}:`

    if (result['emoji'].indexOf(text) < 0) {
      result['emoji'].push(text)
    }
    result['pattern'] += result['emoji'].indexOf(text)
    if (i % cols.value === cols.value - 1 && i !== rows.value * cols.value - 1) result['pattern'] += '|'
  }
  fillTextarea(JSON.stringify({'megamoji_name': result}, null, '  '))
})

// Close the dropdown if the user clicks outside of it
window.addEventListener('click',  function(event) {
  if (event.target.classList.contains('picker-item')) {
    window.__showingPickerFor.value = event.target.textContent

    if (window.__showingPickerFor.id === 'bg') {
      changeGrid()
    }
    emoji.hidden = true
    window__showingPickerFor = null
  } else {
    emoji.hidden = true
    window__showingPickerFor = null
  }
}, true)

function fillTextarea(result) {
  textarea.hidden = false
  textarea.value = result
  textarea.focus()
  textarea.select()
}

function setTraceBackground() {
  if(!trace.files[0]) return
  var reader = new FileReader()
  reader.onload = function (event) {
    grid.style.backgroundImage = `url("${event.target.result}")`
  }
  reader.readAsDataURL(trace.files[0])
}

function changeGrid() {
  var html = ''
  for(var i = 0; i < Number(cols.value); i++) {
    for(var t = 0; t < Number(rows.value); t++) {
      html += `<button
        class="dib flex-auto relative pa0 bn bg-transparent"
        style="width: ${Math.floor((100/cols.value)*100)/100}%">
          <div class="target lh-solid" style="font-size: ${containerWidthInEm/cols.value}em">${bg.value}</div>
        </button>`
    }
  }
  grid.innerHTML = html
}

function addEmojiToKeywordsMap(emoji, list) {
  for (var i = 0; i < list.length; i++) {
    var entry = keywordToEmojiMap[list[i]] || []
    entry.push(emoji)
    keywordToEmojiMap[list[i]] = entry
  }
}

function filterByKeyword(keyword) {
  var results = []
  var html = ''
  for (var key in window.keywordToEmojiMap) {
    if (key.indexOf(keyword) !== -1) {
      // Don't add duplicates
      var list = window.keywordToEmojiMap[key]
      for (var i = 0; i < list.length; i++) {
        if (results.indexOf(list[i]) === -1) {
          results.push(list[i])
          html += `<button class="picker-item dib flex-auto relative pa1 bn bg-transparent">${window.keywordToEmojiMap[key][i]}</button>`
        }
      }
    }
  }
  return html
}

// BTW: In this method, `this` is the input
function showEmojiPicker() {
  // If this is an emoji (the user just inserted it), we don't need
  // to deal with the picker
  if (this.value !== '' && this.value !== twemoji.parse(this.value)) {
    if (this.id === 'bg') {
      changeGrid()
    }
    return
  }

  if (this.value.length < 3) {
    emoji.innerHTML = ''
    emoji.hidden = true
  } else {
    emoji.innerHTML = filterByKeyword(this.value)

    // We don't need to recompute the position if we're already open
    if (emoji.hidden || window__showingPickerFor === this || emoji.innerHTML !== '') {
      window.__showingPickerFor = this
      emoji.hidden = false
      var rekt = this.getBoundingClientRect()
      var parentRekt = this.offsetParent.getBoundingClientRect()
      emoji.style.width = rekt.width + 'px'
      emoji.style.top = rekt.top - parentRekt.top + rekt.height + 'px'
      emoji.style.left = rekt.left - parentRekt.left + 'px'
    }
  }
}

changeGrid()
