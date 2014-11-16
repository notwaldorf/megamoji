$(document).on('ready', function() {
  setGrid()
  setEmojiPaint($('.js-paint').val())
})

// drag
$(document).on('mousedown', '.cell', function (e) {
  boolean = !$(e.target).hasClass('painted')
  markSelected($(e.target), boolean)
  $(document).on('mouseover', '.cell', function (e) {
    markSelected($(e.target), boolean)
  })
})

// drop
$(document).on('mouseup', '.cell', function (e) {
  $(document).off('mouseover', '.cell')
})

$(document).on('change', '.js-grid-rows, .js-grid-cols', function() {
  setGrid()
})

// select an emoji as paint
$(document).on('selected', '.js-paint', function () {
  setEmojiPaint($(this).val())
})

$(document).on('selected', '.js-set-emoji-background', function() {
  setEmojiBackground($('.grid'), $(this).val())
})

$(document).on('click', '.js-reset', resetAll)

$(document).on('change', '.js-set-file-background', function () {
  var reader = new FileReader()
  reader.onload = function (e) {
    $('.grid').css('background-image', 'url("' + e.target.result + '")')
  }
  reader.readAsDataURL(this.files[0])
})

$(document).on('click', '.js-output-script', function() {
  generateScript()
  toggleFacebox(true)
})

$(document).on('click', '.backdrop', function() {
  toggleFacebox(false)
})

function setEmojiPaint (emoji) {
  var emoji = emoji.replace(/:/g, '')
  $('.js-paint-preview').css('background-image', 'url("emojis/' + emoji + '.png")')
}

function setGrid () {
  if($('.cell.painted').length > 0) {
    if(!confirm('Resetting the grid will clear the canvas, are you sure?')) {
      return
    }
  }

  var rows = Number($('.js-grid-rows').val())
  var cols = Number($('.js-grid-cols').val())
  var grid = $('.js-grid')
  var gridWidth = grid.width()
  var cellSize = gridWidth/cols
  grid.html('')

  for(i=0; i < (cols*rows); i++) {
    cell = $("<div class='cell' data-emoji=':white_large_square:' style='width: " + cellSize + "px; height: " + cellSize + "px;'>")
    setEmojiBackground(cell, 'white_large_square')
    grid.append(cell)
  }
}

function markSelected (ele, toggle) {
  if(typeof toggle === 'undefined') { var toggle = true }

  if(toggle) {
    var emoji = $('.js-paint').val()
    ele.addClass('painted')
    ele.attr('data-emoji', emoji)
    setEmojiBackground(ele, emoji)
  } else {
    ele.attr('data-emoji', ':white_large_square:').removeClass('painted')
    setEmojiBackground(ele, 'white_large_square')
  }
}

function generateScript () {
  var tmpEmojis   = []
  var tmpPattern  = ''
  var targetEmoji = $('.js-set-emoji-background').val()
  var hubotScript = '"' + targetEmoji + '": {\n  '
  var emojiScript = ''

  $('.cell').each(function(i) {
    i++
    var emoji = $(this).attr('data-emoji')
    if(tmpEmojis.indexOf(emoji) < 0) tmpEmojis.push(emoji)

    tmpPattern  += tmpEmojis.indexOf(emoji)
    emojiScript += emoji
    if(i % Number($('.js-grid-cols').val()) === 0) {
      tmpPattern  += '|'
      emojiScript += '\n'
    }
  })

  // hubot
  hubotScript += 'emoji: [ ' + tmpEmojis.map(function(e) { return '\'' + e + '\'' }).join(', ') + ' ]\n'
  hubotScript += 'pattern: "' + tmpPattern + '"\n'
  hubotScript += '}'

  $('.js-hubot-script').val(hubotScript)
  $('.js-emoji-script').val(emojiScript)
}

function toggleFacebox (toggle) {
  $('.facebox, .backdrop').toggle(toggle)
}

// helpers
function setEmojiBackground (target, emoji) {
  var emoji = emoji.replace(/:/g, '')
  target.css('background-image', 'url("emojis/' + emoji + '.png")')
}

function resetAll () {
  setEmojiBackground($('.cell.painted'), 'white_large_square')
  $('.cell.painted').removeClass('painted')
}