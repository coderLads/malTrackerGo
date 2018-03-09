// create async function to get data from settings file with a promise
async function getData() {
    return await readFile(pathSet, 'utf-8');
}

// the basic loading function
function loadContent(users) {
    users = users.split("=")[1];
    users = users.replace(/%2C/g, ",");
    users = users.split(",");

    if ($('#divTable').css('display') == 'none') {
        loadRSS(users);
    } else {
        generateTable(users);
    }
}

// create function for generating the dank anime list table
function generateTable(users) {
    // load animeScores for table
    var counter = 0;
    $('#dataTable').find('tbody').empty();
    $('#dataTable').find('tbody').append($('<tr>').attr('id', "header"));
    var header = $("#header");
    $('<td>').text("#").appendTo(header);
    $('<td>').text("title").attr('id', 'title').appendTo(header);
    $('<td>').text("average").appendTo(header);
    $('<td>').text("weighted").appendTo(header);
    for (var i = 0; i < users.length; i++) {
        $('<td>').text(users[i]).appendTo(header);
        getScores(users[i], users, function(data) {
            animeScores = data;
            if (counter == users.length - 1) { // this is where the table gets made
                animeScores.forEach(show => {
                    var sum = 0;
                    var bucket = 0;
                    show[2].forEach(score => {
                        if (score != "") {
                            sum += parseInt(score);
                            bucket++;
                        }
                    });
                    var avg = sum / bucket;
                    $('#dataTable').find('tbody').append($('<tr>').attr('id', animeScores.indexOf(show)));
                    var tr = $("#" + animeScores.indexOf(show));
                    $('<td>').text(animeScores.indexOf(show) + 1).appendTo(tr);
                    $('<td>').text(show[0]).appendTo(tr);
                    $('<td>').text(Math.round(avg * 100) / 100).appendTo(tr);
                    $('<td>').text(Math.round((avg + ((bucket / 10) * (avg))) * 100) / 100).appendTo(tr);
                    show[2].forEach(score => {
                        $('<td>').text(score).appendTo(tr);
                    });
                    fixGradient();
                });
            }
            counter++;
        })
    }
}

// load merged rss feed of the given users
function loadRSS(users) {

    // create list of non filtered statuses
    var activeStatuses = [];
    for (i = 0; i < statusFilter.length; i++) {
        if (statusFilter[i]) { // check if the status is enabled
            activeStatuses.push(statusTexts[i]); // add the related string to the activeStatuses list
        }
    }

    // create list of rss feeds from usernames
    feedList = [];
    url = "https://myanimelist.net/rss.php?type=rw&u="
    users.forEach(user => {
        feedList.push(url + user);
    });

    // create config for rss combiner
    var feedConfig = {
        size: 1000,
        feeds: feedList,
        pubDate: new Date()
    };

    // combine feeds
    RSSCombiner(feedConfig, function(err, combinedFeed) {
        if (err) {
            console.error(err);
        } else {
            var xml = combinedFeed.xml({
                indent: true
            });
            let parser = new Parser();

            // after the feeds are parsed together...
            (async() => {
                var content = document.getElementById("display"); // main containing div

                let feed = await parser.parseString(xml);

                document.getElementById("display").innerHTML = ""; // clear old feed display

                var matchCount = 0; // keeps track of the number of filter matching items

                for (var i = 0; i < feed.items.length; i++) { // loop through all feed items
                    var item = feed.items[i];
                    // check if the feed item matches filters
                    var status = item.content.split("- ")[0];
                    if (activeStatuses.includes(status)) {
                        if (matchCount == feedSize) { // if max feed size is hit, break
                            break;
                        }

                        // create feed item element
                        var div = document.createElement("div");
                        div.setAttribute('class', "item");

                        var a = document.createElement("a");
                        a.textContent = item.title;
                        a.setAttribute('href', item.link);
                        a.setAttribute('target', "_blank");

                        var pubDate = document.createElement("div");
                        var d = new Date(item.pubDate.split("-")[0]);
                        pubDate.textContent = d.toLocaleDateString() + " at " + d.toLocaleTimeString();
                        pubDate.setAttribute("class", "date");

                        var desc = document.createElement("p");
                        if (status != "") {
                            desc.textContent = item.content;
                        } else {
                            desc.textContent = "Re-watching " + item.content;
                        }

                        var person = document.createElement("a");
                        person.textContent = item.creator.split("=")[2];
                        person.setAttribute('class', "person");
                        person.setAttribute('target', "_blank");
                        person.setAttribute("href", "https://myanimelist.net/profile/" + item.creator.split("=")[2]);

                        div.appendChild(a);
                        div.appendChild(pubDate);
                        div.appendChild(desc);
                        div.appendChild(person);
                        content.appendChild(div);
                        matchCount++;
                    }
                }
                fixGradient();
            })();
        }
    });
    fileWrite = "";
    statusFilter.forEach(filter => {
        fileWrite += filter + ",";
    });
    // save settings to file
    fs.writeFile(pathSet, fileWrite + "\n" + firstColor.substring(1) + "," + secondColor.substring(1) + ",\n" + feedSize + ",\n" + users.join(","),
        function(err) {
            if (err) throw err;
        }
    );
}

// fix background gradient on less items than fill screen
function fixGradient() {

    if (window.innerHeight > document.getElementById("content").clientHeight) {
        document.getElementsByTagName("html")[0].style.height = "100%";
    } else {
        document.getElementsByTagName("html")[0].style.height = "";
    }
}

// apply changes to settings, and store them in settings file
function applySettings(color1, color2, fcpl, fw, fptw, foh, fd, fr, ffeedSize) {
    statusFilter[0] = fcpl;
    statusFilter[1] = fw;
    statusFilter[2] = fptw;
    statusFilter[3] = foh;
    statusFilter[4] = fd;
    statusFilter[5] = fr;
    feedSize = ffeedSize;
    firstColor = "#" + color1;
    secondColor = "#" + color2;
    document.getElementsByTagName("html")[0].style.background = "linear-gradient(to bottom right, #" + color1 + ",#" + color2 + ")";
    document.getElementById("btnLoad").click();
    document.getElementById("settingsModal").click();

}

// setup auto color update in settings
function previewColors() {
    var pre1 = $('#color1').val();
    var pre2 = $('#color2').val();
    document.getElementsByTagName("html")[0].style.background = "linear-gradient(to bottom right, #" + pre1 + ",#" + pre2 + ")";
}
// placeholder for fetching scores from myanimelist
function getMalScore(id) {
    return "disabled";
}

// function for getting user's anime list as xml and adding it to the big list
function getScores(user, users, callback) {

    // create feed from username
    var feed = 'https://myanimelist.net/malappinfo.php?u=' + user + '&type=anime&status=all';

    // generate xml request
    request(feed, function(error, response, data) {

        // parse returned xml string
        parseString(data, { trim: true }, function(err, result) {

            // for each show in the user's list
            result['myanimelist']['anime'].forEach(show => {

                // if the show is completed and it's not a movie
                if (show['my_status'][0] == "2" && show['series_type'][0] != "3") {
                    var title = show['series_title'][0];
                    var found = false;

                    // check if the show is already in animeScores
                    for (var i = 0; i < animeScores.length; i++) {
                        if (animeScores[i][0] == title) {
                            animeScores[i][2][users.indexOf(user)] = show['my_score'][0]; // add this user's score
                            found = true;
                            break;
                        }
                    }

                    // if the show was not already in the list, add it
                    if (found == false) {
                        var blankScores = [];
                        for (var l = 0; l < users.length; l++) { // add it with blank placeholders for the other users
                            blankScores.push("");
                        }
                        animeScores.push([title, getMalScore(show['series_animedb_id'][0]), blankScores]);
                        animeScores[animeScores.length - 1][2][users.indexOf(user)] = show['my_score'][0];
                    }
                }
            });
            callback(animeScores);
        });
    });
}