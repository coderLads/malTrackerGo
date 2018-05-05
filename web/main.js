Vue.component('tag-selector', {
    template: `
        <div class="tag-selector">
            <input class="tag-input" type="text" value="PanDoes,Badtz13">
            <button @click="load">Load</button>
        </div>`,
    methods: {
        load: function () {
            // this.$root.users = _.compact($(".tag-input")[0].value.split(","));
        }
    }
});

Vue.component('settings', {
    template: `<button class="button" id="settings">Settings</button>`
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
        users: ["Badtz13", "Rabu870", "PanDoes"],
        feed: []
    },
    methods: {
        populateFeed: function () {

            let users = this.$root.users;
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
                        feed.push({
                            status: $(items[i].getElementsByTagName("description")[0]).text(),
                            user: users[k],
                            link: $(items[i].getElementsByTagName("link")[0]).text(),
                            time: $(items[i].getElementsByTagName("pubDate")[0]).text(),
                            title: $(items[i].getElementsByTagName("title")[0]).text()
                        });
                    }
                }));
            }
            Promise.all(promiseList).then(() => this.$root.feed = feed);
        }
    },
    beforeMount() {
        this.populateFeed();
    }
})