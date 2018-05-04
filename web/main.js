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
        users: Array,
        feed: Array
    },
    methods: {
        populateFeed: function () {
            this.feed = [{
                    status: "Watching - 6 of 12 episodes",
                    user: "crazyawesome",
                    link: "https://myanimelist.net/anime/16732/Kiniro_Mosaic",
                    time: "Tue, 01 May 2018 10:52:42 GMT",
                    title: "Kiniro Mosaic - TV",
                },
                {
                    status: "Watching - 9 of 12 episodes",
                    user: "PanDoes",
                    link: "https://myanimelist.net/anime/9756/Mahou_Shoujo_Madoka★Magica",
                    time: "Tue, 06 May 2018 10:52:42 GMT",
                    title: "Mahou Shoujo Madoka★Magica - TV",
                }
            ]
        }
    },
    beforeMount() {
        this.populateFeed();
    }
})