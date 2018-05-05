Vue.component('tag-selector', {
    props: ['users'],
    template: `
        <div class="tag-selector">
            <input class="tag-input" type="text">
            <button @click="load">Go</button>
        </div>`,
    methods: {
        load: function () {
            let newUsers = _.compact($(".tag-input")[0].value.split(","));
            this.$root.users = newUsers;
            Cookies.set('users', $(".tag-input")[0].value);
            this.$root.populateFeed();
        },
        populate: function () {
            if (Cookies.get("users")) {
                $(".tag-input")[0].value = Cookies.get("users");
            }
        }
    },
    mounted() {
        this.populate();
    }
});

Vue.component('settings', {
    template: `<!-- <button class="button" id="settings">Settings</button> -->`
});

Vue.component('feed-item', {
    props: ['title', 'time', 'status', 'user', 'link'],
    template: `
        <div class="feed-item">
            <div class="title"><a :href="link">{{title}}</a></div>
            <div class="time">{{time}}</div>
            <div class="status">{{status}}</div>
            <div class="user">{{user}}</div>
        </div>`
});

Vue.component('feed-container', {
    template: `
        <div class="feed-container">
            <feed-item v-for="item in $root.feed" :key="item.content" :title="item.title" :time="item.time" :status="item.status" :user="item.user" :link="item.link"></feed-item>
        </div>`
});

// main app container
let app = new Vue({
    el: '#app',
    data: {
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
                                title: $(items[i].getElementsByTagName("title")[0]).text()
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
        }
    },
    beforeMount() {
        this.getCookies();
        this.populateFeed();
    }
})