var myAudio = null;
var mySong = null;


$(function(){
  buildSongTemplates();
});



var fadeIn = function(el, speed, next){
  if(el.volume < 0.9){
    el.volume += 0.05;
    setTimeout(function(){
      fadeIn(el, speed, next);
    }, speed);
  } else{
    if(next) next();
  }
};


var fadeOut = function(el, speed, next){
  if(el.volume > 0.1){
    el.volume -= 0.05;
    setTimeout(function(){
      fadeOut(el, speed, next);
    }, speed);
  } else{
    if(next) next();
  }
};



var showSongSelector = function(){
  $('#intro').removeClass('show');
  $('#song-selector').addClass('show');

  var audio = $('#audio-clips').find('audio')[0];
  audio.volume = 0;
  audio.play();
  fadeIn(audio, 500);
};



var nextSong = function(){
  var $selector = $('#song-selector');
  var index = $selector.find('.song').index('.selected');
  var nextIndex = index+1;

  if(nextIndex > $selector.find('.song').length - 1)
    nextIndex = 0;

  var $thisSong = $($selector.find('.song')[index]);
  var $nextSong = $($selector.find('.song')[nextIndex]);
  var $thisAudio = $('#audio-clips').find('audio')[index];
  var $nextAudio = $('#audio-clips').find('audio')[nextIndex];

  $thisSong.removeClass('selected');
  $nextSong.addClass('selected');

  fadeOut($thisAudio, 15, function(){
    $thisAudio.pause();
    $thisAudio.currentTime = 0;

    $nextAudio.volume = 0;
    $nextAudio.play();
    fadeIn($nextAudio, 150);
  });
};



var selectSong = function(){
  if(!mySong){

    // Find the Selected Audio
    var index = $('#song-selector').find('.song').index('.selected');
    myAudio = $('#audio-clips').find('audio')[index];
    mySong = $('#song-selector').find('.selected').data('title');

    // Highlight the Interface Song
    var $selectedSong = $($('#song-selector').find('.song')[index]);
    $selectedSong.addClass('select');

    // Fade it out, cause it's prolly playing
    fadeOut(myAudio, 100, function(){
      myAudio.pause();
      myAudio.currentTime = 0;

      setTimeout(startVideo, 250);
    });
  }
};



var startVideo = function(){
  // Fade in the selected song
  myAudio.volume = 0.3;
  myAudio.play();

  $('#song-selector').removeClass('show');
  $('#video').addClass('show');

  socket.emit('prep-stage');
  var video = $('#video').find('video')[0];

  // Wait for countdown to end, then turn on lights
  // and start recording
  setTimeout(function(){
    fadeIn(myAudio, 30);
    socket.emit('rock-out', { song: mySong });
  }, 9000);

  // When video done, clean up stage and
  // show social screen
  video.onended = function(e) {
    socket.emit('clean-stage');

    $('#video').removeClass('show');
    $('#done').addClass('show');
    fadeOut(myAudio, 150);

    setTimeout(function(){
      location.reload();
    }, 5000);
  };

  video.play();
};



var socket = io();

socket.on('select-song', function(){
  if(!mySong) selectSong();
});

socket.on('next-song', function(){
  if($('section.screen.show').attr('id') == 'intro')
    showSongSelector();
  else if($('section.screen.show').attr('id') == 'song-selector')
    nextSong();
});
