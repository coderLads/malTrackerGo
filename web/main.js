let loaded = false;

Vue.component('tag-selector', {
    props: ['users'],
    template: `
        <div class="tag-selector">
            <input class="tag-input" type="text">
        </div>`,
    methods: {
        load: function () {
            this.$root.users = _.compact($(".tag-input")[0].value.split(","));
            Cookies.set('users', $(".tag-input")[0].value);
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
    props: ['title', 'time', 'status', 'user', 'link', 'userlink'],
    template: `
        <div class="feed-item">
            <div class="title"><a :href="link">{{title}}</a></div>
            <div class="time">{{time}}</div>
            <div class="status">{{status}}</div>
            <div class="user"><a :href="userlink">{{user}}</a></div>
        </div>`
});

Vue.component('feed-container', {
    template: `
        <div class="feed-container">
            <feed-item v-for="item in $root.feed" :key="item.content" :title="item.title" :time="item.time" :status="item.status" :user="item.user" :link="item.link" :userlink="item.userlink"></feed-item>
        </div>`
});

// main app container
let app = new Vue({
    el: '#app',
    data: {
        interval: 5000,
        users: [],
        feed: [],
        filtered: ['Plan to Watch', 'On Hold', 'Dropped']
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
                promiseList.push(axios.get("https://cors-anywhere.herokuapp.com/" + RSS[k]).then(response => {
                    let parser = new DOMParser();
                    let xmlDoc = parser.parseFromString(response.data, "text/xml");
                    let items = xmlDoc.getElementsByTagName("item");
                    for (let i = 0; i < items.length; i++) {
                        if (!filtered.includes($(items[i].getElementsByTagName("description")[0]).text().split(" - ")[0])) {
                            feed.push({
                                status: $(items[i].getElementsByTagName("description")[0]).text(),
                                user: users[k],
                                link: $(items[i].getElementsByTagName("link")[0]).text(),
                                time: $(items[i].getElementsByTagName("pubDate")[0]).text(),
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
                this.$root.feed = feed.reverse();
            });
        },
        getCookies: function () {
            // get user settings from cookies here
            if (Cookies.get("users")) {
                this.$root.users = Cookies.get("users").split(",");
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

        }
    },
    beforeMount() {
        this.getCookies();
        this.populateFeed();
    },
    mounted() {
        this.setupInterval();
    }
})