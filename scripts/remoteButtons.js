(function() {

    const remote = require('electron').remote;

    function init() {
        // document.getElementById("back-btn").addEventListener("click", function(e) {
        //     document.getElementById("main-view").goBack();
        // });
        // document.getElementById("min-btn").addEventListener("click", function(e) {
        //     const window = remote.getCurrentWindow();
        //     window.minimize();
        // });

        // document.getElementById("max-btn").addEventListener("click", function(e) {
        //     const window = remote.getCurrentWindow();
        //     if (!window.isMaximized()) {
        //         window.maximize();
        //     } else {
        //         window.unmaximize();
        //     }
        // });

        document.getElementById("btnClose").addEventListener("click", function(e) {
            const window = remote.getCurrentWindow();
            window.close();
        });

    }

    document.onreadystatechange = function() {
        if (document.readyState == "complete") {
            init();
        }
    };

})();