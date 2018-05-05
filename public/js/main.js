var ENDPOINT = 'https://aboyon-minesweeper-api.herokuapp.com/';

function load_games() {
  var endpoint = ENDPOINT + '/games/';
  $('#game_container').html('loading all your games...');
  $.get(endpoint, {}, function(data){
  },'json').done(function(data) {
    $('#game_container').html('<button type="button" class="btn btn-primary float-right" onClick="create_game();">Create game</button>');
    $('#game_container').append('<h2>Hi '+localStorage['user_name']+' these are all your games</h2>');
    $.each(data, function(i, game) {
      $('#game_container').append(game_card(game));
    });
  }).fail(function(data) {
    console.log('Error')
  })
}

function load_game(id, warning = true) {
  var endpoint = ENDPOINT + '/games/' + id
  if (warning == true) {
    $('#game_container').html('loading game...');
  }
  $.get(endpoint, {}, function(data){
  },'json').done(function(data) {
    update_game_status(data);
  }).fail(function(data) {
    console.log('Error')
  })
}

function update_game_status(game) {
  $('#game_container').html('');
  for (var col = 0; col < game.cols; col++) {
    for (var row = 0; row < game.rows; row++) {
      square = $.grep(game.squares, function(square) {
        return (square.x == col && square.y == row);
      });
      if (square[0]) {
        $('#game_container').append(cell_builder(game.id, col, row, square[0]));
      }
    }
  }
  if (game.terminated == true) {
    $('#game_container .square').unbind('click');
    $('#game_container .unrevealed').addClass('smile')
  }
}

function cell_builder(game_id, x,y, square) {
  cell = $("<div/>", { "id": "square_" + x + "_" + y }).css({
    'top': y * 60,
    'left': x * 60
  })
  .attr("data-x", x)
  .attr("data-y", y)
  .attr("data-revealed", square.revealed)
  .attr("data-game-id", game_id)
  .addClass('square')

  if (square.revealed == true) {
    cell.addClass('revealed')
    
    if (square.bombs > 0) {
      cell.html(square.bombs)
    } else if (square.is_bomb == true) {
      cell.removeClass('revealed').addClass('bomb')
    }
  } else {
    cell.click(square_click_hander)
    cell.addClass('unrevealed')
  }

  return cell
}

function square_click_hander(event) {
  cell = $(this);
  $('.warnings').html('wait..');
  var endpoint = ENDPOINT + '/games/' + cell.data('game-id') + '/reveal/'+cell.data('x')+'/'+cell.data('y');
  $.ajax({
    url: endpoint,
    type: 'PUT',
    data: "",
    success: function(data) {
      update_game_status(data);
      $('.warnings').html('&nbsp;');
    }
  });
}

function sign_in() {
  $("#game_container").hide();
  $("#game_list").hide();
  $("#game_form").hide();
  $("#sign_up").hide();
  $("#sign_in").show();
  $('.form-signin .btn-block').click(function(e){
    e.preventDefault();
    var that = $(this);
    var endpoint = ENDPOINT + '/sessions/';
    $('.warnings').html('verifying credentials, please wait...');
    $.post(endpoint, {
      "session":{
        "email": $('#signin_email').val(),
        "password": $('#signin_password').val()
        }
      },function(data){
        that.attr('disabled', true);
      },'json').done(function(data){
        localStorage['sessionToken'] = data.session_token
        localStorage['user_name'] = data.name
        $('.warnings').html('');
        user_dashboard();
      }).fail(function(){
        that.attr('disabled', false);
        $('.warnings').html('<b>wrong credentials</b>');
      })
  })
}

function sign_up() {
  $("#game_container").hide();
  $("#game_list").hide();
  $("#game_form").hide();
  $("#sign_in").hide();
  $("#sign_up").show();
  $('.form-signup .btn-block').click(function(e){
    e.preventDefault();
    $('.warnings').html('creating user, please wait...');
    var that = $(this);
    var endpoint = ENDPOINT + '/users/';
    $.post(endpoint, {
      "user":{
        "name": $('#signup_name').val(),
        "email": $('#signup_email').val(),
        "password": $('#signup_password').val()
        }
      },function(data){
        localStorage['sessionToken'] = data.session_token
        localStorage['user_name'] = data.name
        that.attr('disabled', true);
      },'json').done(function(data){
        $('.warnings').html('');
        user_dashboard();
      }).fail(function(){
        that.attr('disabled', false);
        $('.warnings').html('<b>API Error creating your user</b>');
      })
  })
}

function sign_out() {
  localStorage['user_name'] = null;
  localStorage['sessionToken'] = null;
  location.reload();
}

function set_request_headers() {
  $.ajaxSetup({
    headers: { 'Authorization': 'Token token=' + localStorage['sessionToken'] }
  });
}

function user_dashboard() {
  $("#sign_in").hide();
  $("#sign_up").hide();
  $('#sign_in_btn').hide();
  $('#sign_up_btn').hide();
  $('#game_form').hide();
  $('#game_container').show();
  $('#games_btn').show();
  $('#sign_out_btn').show();
  set_request_headers();
  load_games();
}

function game_card(game) {
  card = $("<div/>").addClass('game_card').addClass('card');
  card_body = $('<div/>').addClass('card-body').html(
    '<h5 class="card-title">Size:'+game.rows+'x'+game.cols+'</h5>' +
    '<p class="card-text">Bombs: '+game.bombs+'</p>'
  );
  if (game.over == true) {
    card_body.append('<span class="badge badge-danger float-right">Game Over</span>')
  } else if (game.terminated == true) {
    card_body.append('<span class="badge badge-success float-right">You won!</span>')
  }
  card_body.append('<a href="#" onClick="load_game('+game.id+')" class="btn btn-primary">View game</a>')
  card.append(card_body);
  return card
}

function create_game() {
  $('#game_container').hide();
  $('#game_form').show();
  $('#game_form .btn-block').click(function(e){
    e.preventDefault();
    var that = $(this);
    var endpoint = ENDPOINT + '/games/';
    $.post(endpoint, {
      "game":{
        "rows": $('#game_rows').val(),
        "cols": $('#game_cols').val(),
        "bombs": $('#game_bombs').val()
        }
      },function(data){
        that.attr('disabled', true);
      },'json').done(function(data){
        that.attr('disabled', false);
        user_dashboard();
      }).fail(function(){
        that.attr('disabled', false);
        alert('Ups and error happened');
      })
  })
}

$(document.body).ready(function(){
  if (!localStorage['sessionToken'] || localStorage['sessionToken'] == '' || localStorage['sessionToken'] == 'null') {
    $('#games_btn').hide();
    $('#sign_out_btn').hide();
    $('#sign_in_btn').show();
    $('#sign_up_btn').show();
    sign_in();
  } else {
    user_dashboard();
  }
})