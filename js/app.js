var qrdata = m.stream("")

var appState = m.stream(JSON.parse(localStorage.getItem('regioData')))
// check if first time user:
if(JSON.stringify(appState) === 'null') {
  console.log('generateKey!')
  generateKey().then((key) => {
    regioData = {
      privateKey: key.privateKeyArmored,
      publicKey: key.publicKeyArmored,
      revocationCertificate: key.revocationCertificate,
    }
    localStorage.setItem('regioData', JSON.stringify(appState(regioData)))
  })
}

function generateKey() {
  const passphrase = 'super long and hard to guess secret'
  var options = {
    userIds: [{ name:'Bruno Marten', email:'dawabruma@gmail.com' }], // multiple user IDs
    rsaBits: 4096, // RSA key size
    passphrase,
  };
  return openpgp.generateKey(options)
}

var Layout = {
  view: function(vnode) {
    return m("main.layout", [
        m("nav.menu", [
            m(m.route.Link, { href: "/" }, "Home"),
            m(m.route.Link, { href: "/keys" }, "Keys")
        ]),
        m("section", vnode.children)
    ])
  }
}

var Home = {
  view: function() {
    return [
      m("h1", "Welcome to Regio"),
      m(m.route.Link, { href: "/qr" }, "Read QR")
    ]
  }
}

var Keys = {
  oncreate: function (vnode) {
    var parentWidth = vnode.dom.parentElement.clientWidth
    console.log(parentWidth)
  },
  view: function(vnode) {
    var parentWidth = 1000 // vnode.dom.parentElement.clientWidth
    var qr = new QRious({
      value: "hello", //appState().publicKey,
      size: parentWidth
    })
    return [
      m("h1", "Public Keys"),
      m("img.qr", { src: qr.toDataURL() })
    ]
  }
}

function tick(video, canvasElement) {
  return function() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      var canvas = canvasElement.getContext("2d")
      canvasElement.height = video.videoHeight;
      canvasElement.width = video.videoWidth;
      canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
      var imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
      var code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      if (code) {
        qrdata(code.data)
        //console.log(qrdata())
        m.redraw()
      }
    }
    requestAnimationFrame(tick(video, canvasElement));
  }
}

var ReadQR = {
  oncreate: function(vnode) {
    var state = vnode.state
    var video = state.video.dom
    var canvasElement = state.canvas.dom
    // Use facingMode: environment to attemt to get the front camera on phones
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function(stream) {
      video.srcObject = stream
      video.setAttribute("playsinline", true) // required to tell iOS safari we don't want fullscreen
      video.play()
      requestAnimationFrame(tick(video, canvasElement))
    })
  },
  view: function(vnode) {
    var state = vnode.state
    state.video = m("video")
    state.canvas = m("canvas")
    return [
      m("div.qrdata", qrdata()),
      state.video,
      state.canvas,

    ]
  }
}

var root = document.body
m.route(root, "/", {
  "/": {
    render: function() {
      return m(Layout, m(Home))
    },
  },
  "/keys": {
    render: function() {
      return m(Layout, m(Keys))
    },
  },
  "/qr": {
    render: function() {
      return m(Layout, m(ReadQR))
    },
  }
})

/*
openpgp.generateKey(options).then(function(key) {
  var privkey = key.privateKeyArmored; // '-----BEGIN PGP PRIVATE KEY BLOCK ... '
  var pubkey = key.publicKeyArmored;   // '-----BEGIN PGP PUBLIC KEY BLOCK ... '
  var revocationCertificate = key.revocationCertificate; // '-----BEGIN PGP PUBLIC KEY BLOCK ... '
  openpgp.key.readArmored(privkey).then((obj) => {
    var privKeyObj = obj.keys[0];
    privKeyObj.decrypt(passphrase).then(() => {
      options = {
        message: openpgp.cleartext.fromText('10 Regios für Krispin'), // CleartextMessage or Message object
        privateKeys: [privKeyObj]                             // for signing
      };
      // Bruno:
      openpgp.sign(options).then(function(signed) {
        cleartext = signed.data; // '-----BEGIN PGP SIGNED MESSAGE ... END PGP SIGNATURE-----'
        // Krispin:
        Promise.all([
          openpgp.cleartext.readArmored(cleartext),
          openpgp.key.readArmored(pubkey),
        ]).then(([message, { keys }]) => {
          options = {
            message, // parse armored message
            publicKeys: keys // for verification
          };
          openpgp.verify(options).then(function(verified) {
            validity = verified.signatures[0].valid; // true
            if (validity) {
              console.log('signed by key id ' + verified.signatures[0].keyid.toHex(), verified.data);
            }
          });
        })
      });
    })
  })
});
*/
