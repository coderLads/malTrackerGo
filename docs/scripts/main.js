let loaded = false;
let host = "https://cors-anywhere.herokuapp.com/";

Vue.component('tag-selector', {
    props: ['users'],
    template: `
        <div class="tag-selector">
            <input class="tag-input" type="text">
        </div>`,
    methods: {
        load: function () {
            this.$root.users = _.compact($(".tag-input")[0].value.split(","));
            Cookies.set('users', $(".tag-input")[0].value, {
                expires: 360
            });
            this.$root.populateFeed();
        },
        loadTags: function () {
            let self = this;
            $('.tag-input').tagsInput({
                onChange: _.debounce(function () {
                    if (loaded) {
                        self.load();
                    }
                }, 1000),
                defaultText: "Add a user"
            });

            if (Cookies.get("users")) {
                let cookieUsers = String(Cookies.get("users"));
                $(".tag-input").importTags(cookieUsers);
            } else {
                $(".tag-input").importTags("Badtz13,");
            }
            loaded = true;
        }
    },
    mounted() {
        this.loadTags();
    }
});

Vue.component('settings', {
    template: `<button @click="toggle" class="button" id="settings"><i data-feather="settings"></i></button>`,
    methods: {
        toggle: function () {
            $($(".settings-pane")[0]).toggle('drop', {
                direction: 'right'
            });
            $($(".settings-cover")[0]).toggle('fade');
            $(".blur").css({
                filter: "blur(2px) brightness(90%)"
            });
            $('body').css({
                overflow: "hidden"
            });

            document.getElementById("color1").jscolor.fromString(this.$root.color1);
            document.getElementById("color2").jscolor.fromString(this.$root.color2);
        }
    }
});

Vue.component('feed-item', {
    props: ['title', 'fmttime', 'status', 'user', 'link', 'userlink'],
    template: `
        <div class="feed-item">
            <a class="image-wrapper" :href="link"><div class="image"></div></a>
            <div class="title"><a :href="link">{{title}}</a></div>
            <div class="time">{{fmttime}}</div>
            <div class="status">{{status}}</div>
            <div class="user"><a :href="userlink">{{user}}</a></div>
        </div>`,
    methods: {
        fetchImage(id) {
            let self = this;
            axios.get("https://api.jikan.moe/anime/" + id).then(response => {
                $(self.$el).find(".image").css({
                    "background-image": 'url(' + response.data['image_url'] + ')'
                });
            });
        }
    },
    mounted() {
        this.fetchImage(this.link.split("/")[4]);
    },
    updated() {
        this.fetchImage(this.link.split("/")[4]);
    }
});

Vue.component('feed-container', {
    template: `
        <div class="feed-container">
            <feed-item v-for="item in $root.feed" :key="item.content" :title="item.title" :fmttime="item.fmttime" :status="item.status" :user="item.user" :link="item.link" :userlink="item.userlink"></feed-item>
        </div>`
});

// main app container
let app = new Vue({
    el: '#app',
    data: {
        users: [],
        feed: [],
        interval: 30000,
        limit: 15,
        filtered: [],
        color1: "",
        color2: "",
    },
    methods: {
        populateFeed: function () {

            let users = this.$root.users;
            let filtered = this.$root.filtered;
            let RSS = [];

            users.forEach(user => {
                RSS.push("https://myanimelist.net/rss.php?type=rw&u=" + user);
            });

            let feed = [];

            let promiseList = [];

            for (let k = 0; k < RSS.length; k++) {
                promiseList.push(axios.get(host + RSS[k]).then(response => {
                    let parser = new DOMParser();
                    let xmlDoc = parser.parseFromString(response.data, "text/xml");
                    let items = xmlDoc.getElementsByTagName("item");
                    for (let i = 0; i < items.length; i++) {

                        if ($(items[i].getElementsByTagName("description")[0]).text().split(" - ")[0] == "") {
                            $(items[i].getElementsByTagName("description")[0]).text("Re-Watching - " + $(items[i].getElementsByTagName("description")[0]).text().split(" - ")[1]);
                        }

                        if (!filtered.includes($(items[i].getElementsByTagName("description")[0]).text().split(" - ")[0])) {
                            feed.push({
                                status: $(items[i].getElementsByTagName("description")[0]).text(),
                                user: users[k],
                                link: $(items[i].getElementsByTagName("link")[0]).text(),
                                time: new Date($(items[i].getElementsByTagName("pubDate")[0]).text()).toLocaleString(),
                                fmttime: moment($(items[i].getElementsByTagName("pubDate")[0]).text()).calendar(),
                                title: $(items[i].getElementsByTagName("title")[0]).text(),
                                userlink: "https://myanimelist.net/profile/" + users[k]
                            });
                        }
                    }
                }));
            }
            Promise.all(promiseList).then(() => {
                feed.sort(function (a, b) {
                    return new Date(a.time) - new Date(b.time);
                });
                this.$root.feed = feed.reverse().slice(0, this.$root.limit);
            });
        },
        getCookies: function () {
            // get user settings from cookies here
            Cookies.get("users") ? this.users = Cookies.get("users").split(",") : this.users = ["Badtz13"];

            Cookies.get("limit") ? this.limit = Cookies.get("limit") : true;

            Cookies.get("filtered") ? this.filtered = Cookies.get("filtered").split(",") : this.filtered = ['Plan to Watch', 'On-Hold', 'Dropped'];

            Cookies.get("color1") ? this.color1 = Cookies.get("color1") : this.color1 = "#CE9FFC";
            Cookies.get("color2") ? this.color2 = Cookies.get("color2") : this.color2 = "#5a4fcc";

            let html = document.getElementsByTagName('html')[0];
            html.style.setProperty("--background-one", this.color1);
            html.style.setProperty("--background-two", this.color2);

            this.$root.generateFavicon(this.color1, this.color2);

        },
        setupInterval: function () {

            let self = this;
            let timer;

            function refresh() {
                clearTimeout(timer);
                timer = setTimeout(function () {
                    self.populateFeed();
                    refresh();
                }, self.interval);
            };

            refresh();

            $(document).on('keypress, click, mousemove', refresh);

        },
        updateLog: function () {
            axios.get(host + "https://github.com/coderLads/malTrackerGo/commits/master.atom").then(response => {
                let parser = new DOMParser();
                let xmlDoc = parser.parseFromString(response.data, "text/xml");
                let items = xmlDoc.getElementsByTagName("entry");
                $("#update").text("Last commit: " + $.trim($(items[0].getElementsByTagName("title")).text()));
            });
        },
        populateSettings: function () {
            let self = this;

            // setup feedsize slider
            $("#feedSize").slider({
                min: 5,
                max: 50,
                step: 5,
                value: self.limit,
                slide: function (event, ui) {
                    $('#sliderDisplay').html(ui.value);
                    self.limit = ui.value;
                    Cookies.set('limit', ui.value);
                }
            });

            $('#sliderDisplay').html(this.limit);

            // add feather icons
            feather.replace();

            // setup checkboxes
            $("#plan").prop("checked", !self.filtered.includes("Plan to Watch"));
            $("#watch").prop("checked", !self.filtered.includes("Watching"));
            $("#hold").prop("checked", !self.filtered.includes("On-Hold"));
            $("#drop").prop("checked", !self.filtered.includes("Dropped"));
            $("#complete").prop("checked", !self.filtered.includes("Completed"));
            $("#rewatch").prop("checked", !self.filtered.includes("Re-Watching"));

            //function to close .settings-pane when it is visible and clicked outside of
            $(document).mouseup(function (e) {
                if ($('.settings-cover').is(e.target)) {
                    $('.settings-pane').toggle('drop', {
                        direction: 'right'
                    });
                    $($(".settings-cover")[0]).toggle('fade');
                    $(".blur").css({
                        filter: "none"
                    });
                    $('body').css({
                        overflow: "auto"
                    });

                    self.filtered = [];

                    $("#plan").prop("checked") ? true : self.filtered.push("Plan to Watch");
                    $("#watch").prop("checked") ? true : self.filtered.push("Watching");
                    $("#hold").prop("checked") ? true : self.filtered.push("On-Hold");
                    $("#drop").prop("checked") ? true : self.filtered.push("Dropped");
                    $("#complete").prop("checked") ? true : self.filtered.push("Completed");
                    $("#rewatch").prop("checked") ? true : self.filtered.push("Re-Watching");

                    Cookies.set("filtered", self.filtered.join(","));

                    // reload feed
                    self.populateFeed();

                    // apply and save colors
                    self.color1 = "#" + $('#color1').val();
                    self.color2 = "#" + $('#color2').val();
                    Cookies.set("color1", "#" + $('#color1').val());
                    Cookies.set("color2", "#" + $('#color2').val());
                    let html = document.getElementsByTagName('html')[0];
                    html.style.setProperty("--background-one", self.color1);
                    html.style.setProperty("--background-two", self.color2);

                    this.$root.generateFavicon("#" + $('#color1').val(), "#" + $('#color2').val());
                }
            });
        },
        generateFavicon: function(color1, color2) {
            var link = document.getElementById('favicon');
                var canvas = new fabric.StaticCanvas('favCanvas');
            
                var circle = new fabric.Circle({
                    left: 0,
                    top: 0,
                    radius: 50
                });
            
                circle.setGradient('fill', {
                    x1: 0,
                    y1: 0,
                    x2: circle.width,
                    y2: circle.height,
                    colorStops: {
                        0: color1,
                        1: color2
                    }
                });
                canvas.add(circle);
                var text = new fabric.Text("MAL", {
                    fill: '#fff'
                });
                canvas.add(text);
                text.center();
                var mal = new FontFaceObserver('MyAnimeListLogo')
                mal.load()
                .then(function() {
                    // when font is loaded, use it.
                    text.set("fontFamily", 'MyAnimeListLogo');
                    canvas.requestRenderAll();
                    var dataURL = canvas.toDataURL({
                        format: 'png'
                    });
                    link.href = dataURL;
                }).catch(function(e) {
                    link.href = '../images/icon.png';
                });
        }
    },
    beforeMount() {
        this.getCookies();
        this.populateFeed();
        // this.updateLog();
    },
    mounted() {
        this.setupInterval();
        this.populateSettings();
    }
});