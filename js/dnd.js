/* dnd.js */
var xhr = new XMLHttpRequest();
window.onload=function() {
	sessionStorage.clear();
	if (window.File && window.FileList && window.FileReader) {
		var fileselect = document.getElementById("fileselect"),
			filedrag = document.getElementById("filedrag"),
			submitbutton = document.getElementById("submitbutton");
		
		if (xhr.upload) {	
			filedrag.addEventListener("dragover", FileDragHover, false);
			filedrag.addEventListener("dragleave", FileDragHover, false);
			filedrag.addEventListener("drop", FileSelectHandler, false);
			filedrag.style.display = "block";
		}	
	
	}else{
		document.getElementById("messages").innerHTML = "Navegador no soporta File-FileList-FileReader";
	}
};

function FileDragHover(e) {
	e.stopPropagation();
	e.preventDefault();
	e.target.className = (e.type == "dragover" ? "hover" : "");
}

	/*
	window.onbeforeunload = function (e) {
		xhr2 = new XMLHttpRequest();
		var url = "deleteFiles.php";
		xhr2.open("GET", url, true);
		xhr2.send();
		xhr2.onreadystatechange = function () {
			if (xhr2.readyState == 4 && xhr2.status == 200) {
				console.log(xhr2.responseText);
			}
		}
	};
	*/
	
function deleteFiles() {
xhr2 = new XMLHttpRequest();
		var url = "deleteFiles.php";
		xhr2.open("GET", url, true);
		xhr2.send();
		xhr2.onreadystatechange = function () {
			if (xhr2.readyState == 4 && xhr2.status == 200) {
				console.log(xhr2.responseText);
			}
		}	
}
function FileSelectHandler(e) {
	FileDragHover(e);
	var files = e.target.files || e.dataTransfer.files;
	var RegExPattern = /(gpx)$/;
	if (files[0].name.match(RegExPattern)) {
		var formData = new FormData();
		formData.append('ruta', files[0], files[0].name);
		xhr.open('POST', 'upload.php', true);
		xhr.send(formData);
	} else { 
		alert('extensión no valida');
	}
}

xhr.onreadystatechange = function () {
	if (xhr.readyState == 4 && xhr.status == 200) {
		var response = xhr.responseText;
		if (response != "") {
			//guardo el nombre del fichero subido en la variable de sesión.
			sessionStorage.setItem("rute", response);
			window.open("./PFCMyRute.html", "_self");
		} else 
			alert("failure in the server");
	}
}

