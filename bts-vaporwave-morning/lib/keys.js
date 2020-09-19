var html = require('choo/html')

module.exports = function (camera, root) {
  var css = document.createElement('style')
  css.innerHTML = `
    .keys {
      position: absolute;
      bottom: 1em;
      left: 1em;
    }
    .keys div {
      margin-bottom: 0.5em;
    }
    .keys button {
      background-color: white;
      opacity: 0.2;
      padding: 1em;
      padding-left: 2em;
      padding-right: 2em;
      margin-right: 0.5ex;
      border-width: 0px;
    }
    .keys button:hover {
      opacity: 0.5;
      background-color: #ffe0e0;
    }
    .keys button.active {
      opacity: 0.8;
    }
  `
  document.body.appendChild(css)
  var buttons = {}
  var div = html`<div class="keys">
    <div>
      ${button('w')}
    </div>
    <div>
      ${['a','s','d','shift'].map(button)}
    </div>
  </div>`
  function button (key) {
    var up = keyup(key)
    var down = keydown(key)
    buttons[key] = html`<button
      onmousedown=${keydown(key)} onmouseup=${keyup(key)}
      style=${key === 'w' ? 'margin-left: 5em' : ''}
    >${key}</button>`
    return buttons[key]
  }
  var prevKey = null
  document.addEventListener('touchstart', (ev) => {
    ev.stopPropagation()
    var key = ev.target.textContent.trim()
    if (/^[wasd]$/.test(key)) {
      prevKey = key
      onkeydown({ key, shiftKey })
    }
  })
  window.addEventListener('contextmenu', (ev) => {
    ev.preventDefault()
  })
  document.addEventListener('touchend', (ev) => {
    onkeyup({ key: prevKey })
    prevKey = null
  })
  document.addEventListener('touchcancel', (ev) => {
    ev.preventDefault()
    onkeyup({ key: prevKey })
    prevKey = null
  })
  var shiftKey = false
  function keydown(key) {
    return function (ev) {
      ev.preventDefault()
      if (key === 'shift') {
        shiftKey = !shiftKey
        buttons.shift.className = shiftKey ? 'active' : ''
      } else {
        onkeydown({ key, shiftKey })
      }
    }
  }
  function keyup(key) {
    return function (ev) {
      if (key !== 'shift') onkeyup({ key, shiftKey })
    }
  }
  root.appendChild(div)
  window.addEventListener('keydown', onkeydown)
  window.addEventListener('keyup', onkeyup)
  function onkeyup(ev) {
    if (ev.key === 'w' || ev.key === 'W' || ev.key === 'ArrowUp') {
      buttons.w.className = ''
      camera.move(0,0,0)
    } else if (ev.key === 'a' || ev.key === 'A' || ev.key === 'ArrowLeft') {
      buttons.a.className = ''
      camera.rotate(0,1,0,0)
    } else if (ev.key === 's' || ev.key === 'S' || ev.key === 'ArrowDown') {
      buttons.s.className = ''
      camera.move(0,0,0)
    } else if (ev.key === 'd' || ev.key === 'D' || ev.key === 'ArrowRight') {
      buttons.d.className = ''
      camera.rotate(0,1,0,0)
    } else if (ev.key === 'Shift') {
      buttons.shift.className = shiftKey ? 'active' : ''
    }
  }
  function onkeydown(ev) {
    if (ev.key === 'w' || ev.key === 'W' || ev.key === 'ArrowUp') {
      buttons.w.className = 'active'
      camera.move(0, 0, shiftKey || ev.shiftKey ? -4 : -2)
    } else if (ev.key === 'a' || ev.key === 'A' || ev.key === 'ArrowLeft') {
      buttons.a.className = 'active'
      camera.rotate(0, 1, 0, shiftKey || ev.shiftKey ? 0.16 : 0.12)
    } else if (ev.key === 's' || ev.key === 'S' || ev.key === 'ArrowDown') {
      buttons.s.className = 'active'
      camera.move(0, 0, shiftKey || ev.shiftKey ? 4 : 2)
    } else if (ev.key === 'd' || ev.key === 'D' || ev.key === 'ArrowRight') {
      buttons.d.className = 'active'
      camera.rotate(0, 1, 0, shiftKey || ev.shiftKey ? -0.16 : -0.12)
    } else if (ev.key === 'Shift') {
      buttons.shift.className = 'active'
    }
  }
}
