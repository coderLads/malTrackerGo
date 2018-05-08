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
    template: `<!-- <button class="button" id="settings">Settings</button> -->`
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
                console.log(response.data['image_url']);
                console.log($(self.$el).find(".image").css({
                    "background-image": 'url(' + response.data['image_url'] + ')'
                }));
            });
        }
    },
    mounted() {
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
        filtered: ['Plan to Watch', 'On Hold', 'Dropped'],
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
            if (Cookies.get("users")) {
                this.$root.users = Cookies.get("users").split(",");
            } else {
                this.$root.users = ["Badtz13"];
            }
        },
        setupInterval() {

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
        updateLog() {
            axios.get(host + "https://github.com/coderLads/malTrackerGo/commits/master.atom").then(response => {
                let parser = new DOMParser();
                let xmlDoc = parser.parseFromString(response.data, "text/xml");
                let items = xmlDoc.getElementsByTagName("entry");
                $("#update").text("Last commit: " + $.trim($(items[0].getElementsByTagName("title")).text()));
            });
        }
    },
    beforeMount() {
        this.getCookies();
        this.populateFeed();
        this.updateLog();
    },
    mounted() {
        this.setupInterval();
    }
})