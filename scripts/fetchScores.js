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