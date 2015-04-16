/* reddit.js
 *
 * prints out a hot TIL post from reddit
 */

module.exports = function(app){

    var moment = require('moment'), // time

        reddit = require('redwrap');

    app.get('/reddit', function (req, res){

        console.log('Printing reddit');

        reddit.r('todayilearned').sort('hot').limit(1, function(err, data, redditRes){
            if (err) throw err;

            var posts = data.data.children;

            for(var i = 0; i < posts.length; i++){
                var post = posts[i].data;
                var postTitle = post.title;

                var stickied = post.stickied;
                var isMod = ( post.author === 'TILMods' );
                var hasTags = postTitle.indexOf('[') !==  -1 || postTitle.indexOf(']') !==  -1;

                // if theres no tags use the title
                if( !hasTags && !stickied && !isMod  ){
                    postTitle = postTitle.replace('TIL ', ''); // remove 'TIL '
                    postTitle =  capitaliseFirstLetter(postTitle);

                    res.render(__dirname, {
                        title: 'Reddit',
                        time: moment().format('MMM D YYYY h:mm a'),

                        postTitle: postTitle
                    });

                    break;
                }
            }

        });
    });

    function capitaliseFirstLetter(string){
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

};
