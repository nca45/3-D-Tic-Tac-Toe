var login = document.getElementById('loginButton');
var register = document.getElementById('registerButton');
var user; // This will be set to the user that signs in

var color = '';
var moves = [];
var turn = 'WAIT..';
var player2 = '';

var socket = '';

//HARD CODING THE TABLES TO DYNAICALLY GENERATE
//EVERY CELL IS GIVEN ID = "<LAYER#><ROW#><COL#>"
var layer1_html = 
`<table id="layer1" border="1">
<tr>
<td id="111"></td>
<td id="112"></td>
<td id="113"></td>
<td id="114"></td>
</tr>
<tr>
<td id="121"></td>
<td id="122"></td>
<td id="123"></td>
<td id="124"></td>
</tr>
<tr>
<td id="131"></td>
<td id="132"></td>
<td id="133"></td>
<td id="134"></td>
</tr>
<tr>
<td id="141"></td>
<td id="142"></td>
<td id="143"></td>
<td id="144"></td>
</tr>
</table>`;

var layer2_html = 
`<table id="layer2" border="1">
<tr>
<td id="211"></td>
<td id="212"></td>
<td id="213"></td>
<td id="214"></td>
</tr>
<tr>
<td id="221"></td>
<td id="222"></td>
<td id="223"></td>
<td id="224"></td>
</tr>
<tr>
<td id="231"></td>
<td id="232"></td>
<td id="233"></td>
<td id="234"></td>
</tr>
<tr>
<td id="241"></td>
<td id="242"></td>
<td id="243"></td>
<td id="244"></td>
</tr>
</table>`;

var layer3_html = 
`<table id="layer3" border="1">
<tr>
<td id="311"></td>
<td id="312"></td>
<td id="313"></td>
<td id="314"></td>
</tr>
<tr>
<td id="321"></td>
<td id="322"></td>
<td id="323"></td>
<td id="324"></td>
</tr>
<tr>
<td id="331"></td>
<td id="332"></td>
<td id="333"></td>
<td id="334"></td>
</tr>
<tr>
<td id="341"></td>
<td id="342"></td>
<td id="343"></td>
<td id="344"></td>
</tr>
</table>`;

var layer4_html = 
`<table id="layer4" border="1">
<tr>
<td id="411"></td>
<td id="412"></td>
<td id="413"></td>
<td id="414"></td>
</tr>
<tr>
<td id="421"></td>
<td id="422"></td>
<td id="423"></td>
<td id="424"></td>
</tr>
<tr>
<td id="431"></td>
<td id="432"></td>
<td id="433"></td>
<td id="434"></td>
</tr>
<tr>
<td id="441"></td>
<td id="442"></td>
<td id="443"></td>
<td id="444"></td>
</tr>
</table>`;

//checks for a vertical staright win in a all layers based on the latest move
function checkWinVerticalInAllLayers(move) {
	for (i=1;i<5;i++) {
		id = ''+i+move.row+move.col;
		if (document.getElementById(id).style.backgroundColor !== move.maker) {
			return null;
		}
	}
	return move;
}

//the following function check for a diagonal win in a all layers based on the latest move
// A diagonal win can be a thought of as a vertically diagonal, or horizontally diagonal or digaonally diagonal

// Check for vertical diagonal
function checkWinVerticalDiagonalInAllLayers(move) {
	// this can be a forward diagonal or a backward diagonal

	// forward diagonal
	if (move.layer === move.row) {
		for (i=1;i<5;i++) {
			id = ''+i+i+move.col;
			if (document.getElementById(id).style.backgroundColor !== move.maker) {
				return null;
			}
		}
		return move;
	} else if (move.layer == 5-move.row) {
		// backward diagonal
		for (i=1;i<5;i++) {
			id = ''+i+(5-i)+move.col;
			if (document.getElementById(id).style.backgroundColor !== move.maker) {
				return null;
			}
		}
		return move;
	} else {
		return null;
	}
}

// Check for horizontal diagonal
function checkWinHorizontalDiagonalInAllLayers(move) {
	// this can be a forward diagonal or a backward diagonal

	// forward diagonal
	if (move.layer === move.col) {
		for (i=1;i<5;i++) {
			id = ''+i+move.row+i;
			if (document.getElementById(id).style.backgroundColor !== move.maker) {
				return null;
			}
		}
		return move;
	} else if (move.layer == 5-move.col) {
		// backward diagonal
		for (i=1;i<5;i++) {
			id = ''+i+move.row+(5-i);
			if (document.getElementById(id).style.backgroundColor !== move.maker) {
				return null;
			}
		}
		return move;
	} else {
		return null;
	}
}

// Check for diagonally diagonal
function checkWinDiagonallyDiagonalInAllLayers(move) {
	// this can be a forward diagonal or a backward diagonal in 2 ways	

	// forward diagonal
	if (move.layer === move.col) {
		if (move.row === move.col) {
			for (i=1;i<5;i++) {
				id = ''+i+i+i;
				if (document.getElementById(id).style.backgroundColor !== move.maker) {
					return null;
				}
			}
			return move;
		} else {
			for (i=1;i<5;i++) {
				id = ''+i+(5-i)+i;
				if (document.getElementById(id).style.backgroundColor !== move.maker) {
					return null;
				}
			}
			return move;
		}
	} else if (move.layer == 5-move.col) {
		// backward diagonal
		if (move.row === move.col) {
			for (i=1;i<5;i++) {
				id = ''+i+(5-i)+(5-i);
				if (document.getElementById(id).style.backgroundColor !== move.maker) {
					return null;
				}
			}
			return move;
		} else {
			for (i=1;i<5;i++) {
				id = ''+i+i+(5-i);
				if (document.getElementById(id).style.backgroundColor !== move.maker) {
					return null;
				}
			}
			return move;
		}
	} else {
		return null;
	}
}

//checks for a vertical win in a single layer based on the latest move
function checkWinVertical(move) {
	for (i=1;i<5;i++) {
		id = ''+move.layer+i+move.col;
		if (document.getElementById(id).style.backgroundColor !== move.maker) {
			return null;
		}
	}
	return move;
}

//checks for a horizontal win in a single layer based on the latest move
function checkWinHorizontal(move) {
	for (j=1;j<5;j++) {
		id = ''+move.layer+move.row+j;
		if (document.getElementById(id).style.backgroundColor !== move.maker) {
			return null;
		}
	}
	return move;
}

//checks for a diagonal win in a single layer based on the latest move
function checkWinDiagonal(move) {
	if (move.row===move.col) {
		// forward diagonal
		for (k=1;k<5;k++) {
			id = ''+move.layer+k+k;
			if (document.getElementById(id).style.backgroundColor !== move.maker) {
				return null;
			}
		}
		return move;
	} else if (move.row == 5-move.col) {
		//backward diagonal
		for (k=4;k>0;k--) {
			id = ''+move.layer+k+(5-k);
			if (document.getElementById(id).style.backgroundColor !== move.maker) {
				return null;
			}
		}
		return move;
	} else {
		return null;
	}

}

// check for a win inside the particular layer
// since this function is called after every move, only the most recent move is checked
// returns winning move if won otherwise null
function checkWinInLayer() {
	//get latest move
	move = moves[moves.length-1];

	//check all wins
	if (!checkWinVertical(move)) {
		if (!checkWinHorizontal(move)) {
			if (!checkWinDiagonal(move)) {
				return null;
			} else {
				return move;
			}
		} else {
			return move;
		}
	} else {
		return move;
	}
}

// check for a win considering all layers
// since this function is called after every move, only the most recent move is checked
// returns winning move if won otherwise null
function checkWinInAllLayers() {
	//get latest move
	move = moves[moves.length-1];

	//check all wins
	if (!checkWinVerticalInAllLayers(move)) {
		if (!checkWinVerticalDiagonalInAllLayers(move)) {
			if (!checkWinHorizontalDiagonalInAllLayers(move)) {
				if(!checkWinDiagonallyDiagonalInAllLayers(move)) {
					return null;
				} else {
					return move;
				}
			} else {
				return move;
			}
		} else {
			return move;
		}
	} else {
		return move;
	}
}

function clickEvent() {
	// change color, add move to the array, and check for win.
	this.style.backgroundColor = color;
	theId = this.id;
	move = {
		maker : this.style.backgroundColor,
		layer : theId.charAt(0),
		row : theId.charAt(1),
		col : theId.charAt(2),
		won: false
	}
	moves.push(move);
	if (checkWinInLayer() || checkWinInAllLayers()) {	
		moves[moves.length-1].won = true;
	}
	moves[moves.length-1].toPlayer = player2;
	if (turn==='blue') turn = 'purple';
	else turn = 'blue';

	$('#turn').html(turn);
	$('#turn').css("color",turn);
	deactivateBoard();

	socket.emit('madeMove', move);
	//send move to server.
}

//Generate tables in html
function setUpBoard() {
	//div1 will have all the tables
	$('#div1').append('<h4 id="playerConnected"> Waiting for player... </h4>');
	$('#div1').append('<h4> You are color: </h4>');
	$('#div1').append('<h4 style="color:'+ color + '">' + color + '</h4>');
	$('#div1').append('<h4> Turn: </h4>');
	$('#div1').append('<h4 id="turn" >' + turn + '</h4>');
	$('#div1').append('<button id="quitGame"> QUIT GAME </button>');
	$('#div1').append('<button id="viewstats"> VIEW OPPONENT STATS </button>');
	$('#div1').append('<div id="div2"></div>');
	$('#div2').append('<h6> Layer 1 </h6>');
	$('#div2').append(layer1_html);
	$('#div2').append('<h6> Layer 2 </h6>');
	$('#div2').append(layer2_html);
	$('#div2').append('<h6> Layer 3 </h6>');
	$('#div2').append(layer3_html);
	$('#div2').append('<h6> Layer 4 </h6>');
	$('#div2').append(layer4_html);

	document.getElementById('quitGame').addEventListener('click', function() {
		socket.emit('quit');
	});
	document.getElementById('viewstats').addEventListener('click', getOpponentStats);
}

function getOpponentStats(){

	if(player2 === ''){
		console.log("No player has connected yet!");
	}
	else{
		$.ajax({

			method:'get',
			url: `/stats/${player2}`,
			data:'',
			success: printStats
		});
	}
}

function printStats(data){

	$("#myModal").remove(); //ensure there's only 1 modal and we're not continuously adding modals

	var modalBody = `<div id="myModal" class="modal">

 					<!-- Modal content -->
 					<div class="modal-content">
    					<div class="modal-header">
      						<span class="close">&times;</span>
      						<h2>${player2}'s Game Stats</h2>
    					</div>
    				<div class="modal-body">
      					<p>Games Played: ${data.games}</p>
      					<p>Games Won: ${data.wins}</p>
      					<p>Games Lost: ${data.losses}</p>
      					<p>Games Tied: ${data.draws}</p>
    				</div>
    				</div>`

	$('body').prepend(modalBody);

	var modal = document.getElementById("myModal");
	var span = document.getElementsByClassName("close")[0];

	modal.style.display = "block";

	span.onclick = function(){
		modal.style.display = "none";
	}
	window.onclick = function(event){
		if(event.target == modal){
			modal.style.display = "none";
		}
	}
}

function activateBoard() {
	//Add click event to the required cells
	for (i=1;i<5;i++) {
		for (j=1;j<5;j++) {
			for (k=1;k<5;k++) {
				id = ''+i+j+k;
				if (document.getElementById(id).style.backgroundColor === '') {
					document.getElementById(id).addEventListener('click', clickEvent);
				}
			}
		}
	}
}

function deactivateBoard() {
	//remove click event to the required cells
	for (i=1;i<5;i++) {
		for (j=1;j<5;j++) {
			for (k=1;k<5;k++) {
				id = ''+i+j+k;
				if (document.getElementById(id).style.backgroundColor === '') {
					document.getElementById(id).removeEventListener('click', clickEvent);
				}
			}
		}
	}
}

function updateGameList(data) {
	games = data.games;
	games.forEach(function(game){
		$('#list').append('<li> <button id="' + game.host + '"> '+game.host+"'s game </button></li>");
		theButton = document.getElementById(game.host);
		if (theButton !== undefined || theButton !== null) {
			theButton.addEventListener('click', function(){
				var css = $('link[href*="./html_files/login_style.css"]');
				css.replaceWith('<link href="./html_files/game_style.css" type="text/css" rel="stylesheet">');
				$('#div1').empty();
				$('#div2').remove();
				$('#div3').remove();
				color = "purple";
				setUpBoard();
				// tell the server this user is joining game of username.
				socket.emit('joinGame',game);
			});
		}
	});
}

function generateStatsPage() {

	socket = io.connect({transports: ['websocket']},'http://localhost:24824/');

	socket.on('connect', function(){ 
    	socket.emit('identify', user);
	});

	socket.on('openGame', function(game) {
		$('#list').append('<li> <button id="' + game.host + '"> '+game.host+"'s game </button></li>");
		theButton = document.getElementById(game.host);
		if (theButton !== undefined || theButton !== null) {
			theButton.addEventListener('click', function(){
				var css = $('link[href*="./html_files/login_style.css"]');
				css.replaceWith('<link href="./html_files/game_style.css" type="text/css" rel="stylesheet">');
				$('#div1').empty();
				$('#div2').remove();
				$('#div3').remove();
				color = "purple";
				setUpBoard();
				// tell the server this user is joining game of username.
				socket.emit('joinGame',game);
			});
		}
	});

	socket.on('closedGame', function(game) {
		$('#' + game.host).remove();
	});

	socket.on('end', function() {
		socket.emit('end');
		location.reload();
	});

	socket.on('connected', function(username) {
		player2 = username;
		h4 = document.getElementById('playerConnected');
		if (h4!== null) {
			h4.innerText = username + ' has connected.';
		}
	});

	socket.on('makeMove', function(prevMove) {
		if (prevMove!==null) {
			id = ''+prevMove.layer+prevMove.row+prevMove.col;
			document.getElementById(id).style.backgroundColor = prevMove.maker;
		}
		turn = color;
		$('#turn').html(turn);
		$('#turn').css("color",turn);
		activateBoard();
	});

	socket.on('win', function(prevMove) {
		alert("Congrats. You won the game.");
		socket.emit('end');
		location.reload();
	});

	socket.on('loss', function(prevMove) {
		alert("Unlucky. You lost the game.");
		socket.emit('end');
		location.reload();
	});

	$('h4').remove();
	$('#div1').empty();
	$('#div2').remove();
	$('#div1').append('<h4>' + user.username + "'s statistics:" + '</h4>');
	$('#div1').append('<h6> Games Played: ' + user.stats.games + '</h6>');
	$('#div1').append('<h6> Games Won: ' + user.stats.wins + '</h6>');
	$('#div1').append('<h6> Games Lost: ' + user.stats.losses + '</h6>');
	$('#div1').append('<h6> Games Drawn: ' + user.stats.draws + '</h6>');
	$('#div1').append('<h6> </h6>');
	$('#div1').append('<button id="deleteProfile"> DELETE PROFILE </button>');
	$('#div1').append('<h6> </h6>');
	$('#div1').append('<button id="logout"> LOGOUT </button>');
	document.getElementById("div1").style.height = "auto";
	document.getElementById("div1").style.width = "auto";

	$('<div id="div2"> <div>').insertBefore("#script1");
	$('#div2').append('<button id="createGame"> Create Game </button>');
	$('#div2').append('<h4>OR<h4>');
	$('#div2').append('<h4> Join a game from the list: </h4>');
	$('#div2').append('<ul id="list"> </ul>');
	document.getElementById("div2").style.height = "auto";
	document.getElementById("div2").style.width = "auto";

	$.ajax({
        type: "GET",
        url: "/games",
        success: updateGameList
    });

	document.getElementById("createGame").addEventListener('click', function() {
		var css = $('link[href*="./html_files/login_style.css"]');
		css.replaceWith('<link href="./html_files/game_style.css" type="text/css" rel="stylesheet">');
		$('#div1').empty();
		$('#div2').remove();
		$('#div3').remove();
		color = "blue";
		setUpBoard();
		// tell the server this user is creating a game.
		socket.emit('createGame',user);
	});

	document.getElementById('logout').addEventListener('click', function() {
		socket.emit('end');
		location.reload();
	});

	document.getElementById('deleteProfile').addEventListener('click', function() {
		$.ajax({
        	type: "DELETE",
        	url: "/users?username=" + user.username + '&password=' + user.password,
        	data: user,
        	success: handleDelete
    	});
	});

}

function handleLogin(res) {
	if (res.success) {
		// Forward to stats page
		user = res.user;
		generateStatsPage();
	} else {
		alert("Incorrect username or password entered. Try Again.");
	}
}

function handleDelete(res) {
	if (res.success) {
		// Forward to stats page
		location.reload();
	} else {
		alert("Delete failed.");
	}
}

function handleRegistration(res) {
	if (res.success) {
		alert("Successfully registered the user.");
	} else {
		alert("The username has been taken. Try a different one.");
	}
}

login.addEventListener('click', function() {
	var password = document.getElementById('password_login').value;
	var username = document.getElementById('username_login').value;
	if (password === '' || username === '') {
		alert('Enter a username and password to login.');
		return;
	} else {
		var loginCred = {
			username: username,
			password: password,
		};
		$.ajax({
        	type: "POST",
        	url: "/login",
        	data: loginCred,
        	success: handleLogin
    	});
	}
});

register.addEventListener('click', function() {
	var password = document.getElementById('password_register').value;
	var username = document.getElementById('username_register').value;
	if (password === '' || username === '') {
		alert('Enter atleast a username and password to register.');
		return;
	} else {
		var registerCred = {
			username: username,
			password: password,
			fname: document.getElementById('fname').value,
			lname: document.getElementById('lname').value,
			age: document.getElementById('age').value,
			gender: $("input[name=gender]:checked").val(),
			email: document.getElementById('email').value,
		};
		$.ajax({
        	type: "POST",
        	url: "/register",
        	data: registerCred,
        	success: handleRegistration
    	});
	}
});