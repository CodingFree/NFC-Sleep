(function () {
    this._started = false;
    this.tag = null;
    start();

    function notify(titleid, body, bodyid, onClick) {
        console.log("A notification would be send: " + titleid);

        var canSend = false;


        if (Notification.permission === "granted") {
            // If it's okay let's create a notification
            canSend = true;
        }

        // Otherwise, we need to ask the user for permission
        if (Notification.permission !== 'denied') {
            Notification.requestPermission(function (permission) {
                // If the user accepts, let's create a notification
                if (permission === "granted") {
                    canSend = true;
                }
            });
        }

        if(canSend) {
            var notification = new window.Notification(titleid, {
                body: body,
                icon: '/style/icons/32.png'
            });
            notification.onclick = function () {
                notification.close();
                if (onClick) {
                    new MozActivity({
                        name: "view",
                        data: {
                            type: "url",
                            url: body
                        }
                    });
                }
            };
        }
    }

    function changeSettings(){
        var settings = window.navigator.mozSettings;
        var lock = settings.createLock();
        var result = lock.set({
                'wifi.enabled': false,
                'bluetooth.enabled': false,
                'powersave.enabled': true,
                'ril.data.enabled': false,
                'audio.volume.content': 0,
                'audio.volume.notification': 0

        });     

        result.onsuccess = function () {
          console.log("NFC-Sleep: The setting has been changed");
          notify("NFC-Sleep", "The setting has been changed");
        }

        result.onerror = function () {
          console.log("NFC-Sleep: An error occure, the setting remain unchanged");
          notify("NFC-Sleep", "An error occure, the setting remain unchanged");
        }
    }

    function manageNDEFRecords(ndefRecords) {
        console.log("NFC-Sleep: managing NDEF records.");
        var ndefLen = ndefRecords ? ndefRecords.length : 0;
        if(ndefLen != 0){
            var outputString = '';
            for (i = 0; i < ndefLen; i++) {
                payload = dumpUint8Array(ndefRecords[i].payload.wrappedJSObject);
            }
            console.log("NFC-Sleep: "+payload);
            if (payload.localeCompare("NFC-Pass1") === 0){
                changeSettings();
            }

        }
      }

    function handleTagFound(ndefObject){
        console.log("NFC-Sleep: Tag found");
        var ndefRecords = ndefObject.ndefRecords;
        var ndefLen = ndefRecords ? ndefRecords.length : 0;

         // if no NDEF Records are contained, bail out.
        if (!ndefLen) {
          console.log("NFC-Sleep: The tag is blank")
          return true;
        }

        console.log("NFC-Sleep: The tag is okay, lets read it");
        manageNDEFRecords(ndefObject.ndefRecords);
        return false;
    }

    function dumpUint8Array(array) {
      if (!array) {
        return 'null';
      }
      var str = '';
      var i;
      var arrayLen = array ? array.length : 0;
      for (i = 0; i < arrayLen; i++) {
        str += '' + hex2a(array[i].toString(16));
      }
      return str + '';
    }

    function hex2a(hexx) {
        var hex = hexx.toString();//force conversion
        var str = '';
        for (var i = 0; i < hex.length; i += 2)
            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        return str;
    }

    function stop() {
        if (!this._started) {
            throw 'Instance was never start()\'ed but stop() is called.';
        }
        this._started = false;
        window.removeEventListener('mozChromeEvent', this.handleEvent);
    }

    function start() {
        console.log("NFC Sleep Running LOL");
        if (this._started) {
            throw 'Instance should not be start()\'ed twice.';
        }
        var nfc = window.navigator.mozNfc;
        if (!nfc) {
            console.log('Go home NFC, you are not available. Please, disable this addon.');
            return;
        } else {
            console.log('NFC Sleep enabled.');
            this._started = true;
            nfc.ontagfound = handleTagFound.bind(this);
        }
    }

}());