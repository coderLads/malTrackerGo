var RSSCombiner = require('rss-combiner');
var fs = require('fs');

var techFeedConfig = {
    size: 20,
    feeds: [
        'https://myanimelist.net/rss.php?type=rw&u=Badtz13', // BBC tech news
        'https://myanimelist.net/rss.php?type=rw&u=PanDoes',
        'https://www.theguardian.com/uk/technology/rss'
    ],
    pubDate: new Date()
};

RSSCombiner(techFeedConfig)
    .then(function(feed) {
        var xml = feed.xml({ indent: true });
        fs.writeFile('example/xml/tech-example.xml', xml, function(err) {
            if (err) {
                console.error(err);
            } else {
                console.log('Tech feed written');
            }
        });
    });