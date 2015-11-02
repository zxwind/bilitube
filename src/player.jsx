var PlayerControl = React.createClass({
    render: function () {
        if (this.props.playerState == 1)
        {
            var play_bttn_cls = "fa fa-pause";
        }
        else
        {
            var play_bttn_cls = "fa fa-play";
        }
        return (
            <div id='player_control'>
                <div>
                    <progress value="0" max="100" ref="progressBar" onClick={this.props.onPlayerJump}>0%</progress>
                </div>
                <i className={play_bttn_cls} onClick={this.props.onPlayerStartOrPause}></i>
                <i className="fa fa-expand" onClick={this.props.onPlayerExpandOrCompress}></i>
            </div>
        ) 
    }
});

var Player = React.createClass({
    onPlayerReady: function(event) {
        this.setState({player: event.target, player_state: event.target.getPlayerState()});
    },
    onPlayerStatusChange: function(event) {
        this.setState({player_state: event.data});
    },
    onYouTubeIframeAPIReady: function() {
        new YT.Player(
            'player',
            {
                height: "390",
                width: "640",
                playerVars: {"wmode": "transparent", "controls":0, "modestbranding":1, "showinfo":0, "autohide":1},
                events: {
                    "onReady": onPlayerReady,
                    "onStateChange": onPlayerStatusChange
                }
            }
        );
    },
    expand: function(event) {
        var playerElement = $('#player_container')[0];
        var requestFullScreen = playerElement.requestFullScreen || playerElement.mozRequestFullScreen || playerElement.webkitRequestFullScreen;
        if (requestFullScreen) {
            $(document).on("webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange", function(event) {
                this.CM.setBounds();
            }.bind(this));
            requestFullScreen.bind(playerElement)();
        }
    },
    play: function(event) {
        if (this.state.player_state == YT.PlayerState.PLAYING)
        {
            this.state.player.pauseVideo();
            this.CM.stop();
            clearInterval(this.state.pVal);
        }
        else
        {
            if (this.state.player_state == YT.PlayerState.PAUSED)
            {
                this.state.player.playVideo();
                this.CM.start();
            }
            else
            {
                this.getComments(this.props.bilibili_id);
                this.state.player.loadVideoById(this.props.youtube_id, 0, 'default')
            }
            this.state.pVal = setInterval(function(){
                    if (this.state.player.getDuration()) {
                        jQuery('progress').val(this.state.player.getCurrentTime()/this.state.player.getDuration()*100);
                    }
                }.bind(this), 100); 
        }
    },
    jump: function(event) {
        var rect = event.target.getBoundingClientRect();
        var percent = (event.clientX - rect.left) / event.target.offsetWidth;
        new_time = this.state.player.getDuration() * percent;
        this.state.player.seekTo(
            new_time,
            true
        );
        this.CM.time(new_time*1000);
    },
    loadCommentsFromServer: function(cid) {
        var comment_url = 'http://comment.bilibili.com/' + cid + '.xml';
        $.ajax({
            url: comment_url,
            cache: false,
            success: function(data) {
                    var stage = React.findDOMNode(this.refs.comment_stage);
                    this.CM = new CommentManager(stage);

                    this.CM.init();

                    var tlist=BilibiliParser(data, '', true);
                    this.CM.load(tlist);

                    this.CM.start();

                    var startTime = 0, iVal = -1;

                    var startTime = Date.now(); 

                    var iVal = setInterval(function(){
                            this.CM.time(this.state.player.getCurrentTime()*1000);
                        }.bind(this), 100); 

                }.bind(this),
                error: function(xhr, status, err) {
                    console.error(this.props.url, status, err.toString());
                }.bind(this)
        });
    },
    filterRawData: function(data){
        data = data.replace(/<body[^>]*>/g,'');
        data = data.replace(/<?\/body[^>]*>/g,'');
        data = data.replace(/[\r|\n]+/g,'');
        data = data.replace(/<--[\S\s]*?-->/g,'');
        data = data.replace(/<noscript[^>]*>[\S\s]*?<\/noscript>/g,'');
        data = data.replace(/<script[^>]*>[\S\s]*?<\/script>/g,'');
        data = data.replace(/<script.*\/>/,'');
        return data;
    },
    getComments: function(bilibili_id) {
        var api_url = 'http://www.bilibilijj.com/Api/AvToCid/' + bilibili_id
        var yql_url = 'http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22' + encodeURIComponent(api_url) + "%22&format=xml'&callback=?";
        $.ajax({
            url: yql_url,
            dataType: "json",
            cache: false,
            success: function(data) {
                if (data.results && data.results[0])
                {
                    try {
                        var parsed_data = JSON.parse(this.filterRawData(data.results[0]));
                        this.loadCommentsFromServer(parsed_data['cid']);
                    } catch (e)  {
                        console.error(e.toString());
                    } 
                }
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },
    getInitialState: function() {
        return {player: null, player_state: -1, pVal: -1};
    },
    componentDidMount: function(){
        window.onPlayerReady = this.onPlayerReady;
        window.onPlayerStatusChange = this.onPlayerStatusChange;
        window.onYouTubeIframeAPIReady = this.onYouTubeIframeAPIReady;
    },
    render: function() {
        var thumb_img_url = '';
        var player_status = '';
        var thumb_class = '';
        if (this.props.youtube_id)
        {
            thumb_img_url = "http://img.youtube.com/vi/" + this.props.youtube_id +"/maxresdefault.jpg";
            player_status = 'loaded ';
        }
        else
        {
            thumb_img_url = "";
            thumb_class = 'blank';
        }

        if (this.state.player)
        {
            if (this.state.player_state == YT.PlayerState.PLAYING)
                player_status += 'playing';
            else if (this.state.player_state == YT.PlayerState.PAUSED) 
                player_status += 'paused';
            else if (this.state.player_state == YT.PlayerState.UNSTARTED) 
                player_status += 'unstarted';
            else if (this.state.player_state == YT.PlayerState.ENDED) 
                player_status += 'ended';
            else if (this.state.player_state == YT.PlayerState.BUFFERING) 
                player_status += 'buffering';
            else if (this.state.player_state == YT.PlayerState.CUED) 
                player_status += 'cued';
        
        }

        return (
            <div className={player_status}>
            <img id="video_thumb" className={thumb_class} src={thumb_img_url} />
            <div id="player"></div>        
            <PlayerControl playerState={this.state.player_state} onPlayerStartOrPause={this.play} onPlayerExpandOrCompress={this.expand} onPlayerJump={this.jump}/>
            <div className="container"  id="comment_container" ref="comment_stage"></div>
            </div>
        )    
    }        
});

var PlayerForm = React.createClass({
    parse_youtube_id: function(url){
      // From https://gist.github.com/takien/4077195
      var id = '';
      url = url.replace(/(>|<)/gi,'').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
      if(url[2] !== undefined) {
        id = url[2].split(/[^0-9a-z_\-]/i);
        id = id[0];
      }
      else {
        id = url[0];
      }
      return id;
    },
    parse_bilibili_id: function(url){
        var id = '';
        url = url.split('/av')
        if (url[1] != undefined ){
            var split_ids = url[1].split('/');
            id = split_ids[0];
            if (split_ids[1]) {
                var pid = split_ids[1].replace('index_', '').replace('.html', '');
                id = id + '/' + pid;
            }
            else {
                id = id + '/1';
            }
        }
        else {
            id = url[0];
        }
        return id;
    },
    handleSubmit: function(e) {
        e.preventDefault();
        var youtube_id = this.parse_youtube_id(
            React.findDOMNode(this.refs.youtube_id).value.trim());
        var bilibili_id = this.parse_bilibili_id(
            React.findDOMNode(this.refs.bilibili_id).value.trim());
        if (!youtube_id || !bilibili_id) {
          return;
        }
        this.props.onPlayerSubmit(youtube_id, bilibili_id);
    },
    render: function() {
        return (
          <form className="playerForm pure-form pure-form-stacked" onSubmit={this.handleSubmit}>
            <fieldset>
            <input type="text" className="pure-u-23-24" placeholder="Youtube ID" ref="youtube_id" defaultValue={this.props.youtube_id}/>
            <input type="text" className="pure-u-23-24" placeholder="Bibili ID" ref="bilibili_id" defaultValue={this.props.bilibili_id}/>
            <button type="submit" className="pure-button pure-button-primary">Update</button>
            </fieldset>
          </form>
        );
    }        
});

var PlayerContainer = React.createClass({
    getInitialState: function() {
        return {comments: null}; 
    },
    handlePlayerSubmit: function(youtube_id, bilibili_id) {
        this.setState({youtube_id: youtube_id, bilibili_id: bilibili_id});
    },
    render: function() {
        return (
            <div>
                <PlayerForm onPlayerSubmit={this.handlePlayerSubmit} youtube_id={this.state.youtube_id} bilibili_id={this.state.bilibili_id}/>
                <div id="player_container" className="abp">
                    <Player youtube_id={this.state.youtube_id} bilibili_id={this.state.bilibili_id} />
                </div>
            </div>
        ) 
    }
});

$(function(){
    React.render(
        <PlayerContainer/>,
        $('#content')[0]
    );
});
