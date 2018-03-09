function getMalScore(id) {
    return "disabled";
}

function getScores(user, users, callback) {
    var feed = 'https://myanimelist.net/malappinfo.php?u=' + user + '&type=anime&status=all';

    request(feed, function(error, response, data) {
        parseString(data, { trim: true }, function(err, result) {
            result['myanimelist']['anime'].forEach(show => {

                if (show['my_status'][0] == "2" && show['series_type'][0] != "3") {
                    var title = show['series_title'][0];
                    var found = false;

                    for (var i = 0; i < animeScores.length; i++) {
                        if (animeScores[i][0] == title) {
                            animeScores[i][2][users.indexOf(user)] = show['my_score'][0];
                            found = true;
                            break;
                        }
                    }

                    if (found == false) {
                        var blankScores = [];
                        for (var l = 0; l < users.length; l++) {
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