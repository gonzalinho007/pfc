/* 
	PFC my_cesium Library: CesiumJS + ThreeJS 
	This library uses tiles of CesiumJS and Threejs to create a mesh.
*/
//variable to access to data in Cesium.
var aCesiumTerrainProvider = new Cesium.CesiumTerrainProvider({
	url : '//cesiumjs.org/stk-terrain/tilesets/world/tiles'
});
/*
	Variable global to handler the asynchronous cesium terrain provider.
*/
var info_tiles;
var combined_mesh = new THREE.Geometry();
var x = 0, y = 0, z = 0;
var mapbox_texture, index_tile = 0;
/*
	Function request data.
*/
function requestTilesWhenReady() {
	if (aCesiumTerrainProvider.ready) {
		console.log("[PFC my_cesium_mesh.js]: Cesium Server Terrain Provider ready");
		getRute();
	} else {
		//console.log("[PFC]:Waiting a Terrain Provider is ready");
		setTimeout(requestTilesWhenReady, 10);
	}
}
/*
	Function request data gpx.
*/
function getRute() {
	xhr = new XMLHttpRequest();
	if (xhr.upload) {
		var url = "getRute.php";
		var contenido = "rute="+sessionStorage.rute;
		xhr.open("GET", url+"?"+contenido, true);
		xhr.send();
		xhr.onreadystatechange = function () {
			if (xhr.readyState == 4 && xhr.status == 200) {
				if (xhr.responseText != "") {
					load(JSON.parse(xhr.responseText));
					console.log("[PFC my_cesium_mesh.js]: File " + sessionStorage.rute + " loaded.");
				}else {
					console.log("[PFC my_cesium_mesh.js]: Error donwload rute gpx Ajax.");
				}
				
			}
		}
	}
}
/*
	Function create scene and GUI with threejs.js my library.
*/
function load(coord) {
	/*
		info_tiles contains all information about tiles of the rute gpx.
		Each element of the array is a InfoTile element.
	*/ 
	//Create scene ThreeJs with threejs.js
	loadThreeJS();
	//Create Graphic User Interface with gui.js
	createGUI();
	info_tiles = checkTile(coord);
	for(i = 0; i < info_tiles.length; i++) {
		//mapbox_texture = sessionStorage.name + i + info_tiles[i].cardinality;
		aCesiumTerrainProvider.requestTileGeometry(info_tiles[i].x, info_tiles[i].y, 12, true).then(function(data){
			// Send data of Cesium to combine Mesh.
			combineMesh(data);
		});
		
	}
	
}
/*
	Function to handler the information from Cesium asynchronous function requestTileGeometry.
	Change values of info_tiles.
*/
function combineMesh(data){
	//combined_mesh
	var mesh, verticesQuantized, facesQuantized, geometry;
	verticesQuantized = data._quantizedVertices;
	var xx = data._uValues, 
		yy = data._vValues,
		heights = data._heightValues;
	facesQuantized = data._indices;
	var geometry = new THREE.Geometry();
	for(var i=0; i < heights.length; i++){
		geometry.vertices.push( new THREE.Vector3(Math.round(xx[i]/1000),Math.round(yy[i]/1000),Math.round(heights[i]/1000)));
	}
	for(var i=0; i < facesQuantized.length; i=i+3){
		geometry.faces.push(new THREE.Face3(facesQuantized[i], facesQuantized[i+1], facesQuantized[i+2]));
	}
	// Texture only in surface.
	geometry = addFaceVertexUvs(geometry);
	geometry = addBase(geometry);
	//geometry = addFaceVertexUvs(geometry);
	var texture = THREE.ImageUtils.loadTexture( "./textures/"+ sessionStorage.name + index_tile + info_tiles[index_tile].cardinality +".png" );
	var material= new THREE.MeshBasicMaterial( { map: texture, wireframe: true, side:THREE.DoubleSide } );
	mesh = new THREE.Mesh( geometry, material );
	switch (info_tiles[index_tile].cardinality) {
			case "c":	x = 0; y = 0;
						studyVertices(geometry, "c");
						mesh.rotation.x =  Math.PI / 180 * (-90);
						mesh.position.set(x, y, z);
						scene.add(mesh);
						break;
			case "s":	z = z + 33;
						studyVertices(geometry, "s")
						mesh.rotation.x =  Math.PI / 180 * (-90);
						mesh.position.set(x, y, z);
						scene.add(mesh);
						break;
			case "n":	z = z - 33;
						break;
			case "w":	x = x - 33;
						break;
			case "e":	x = x + 33;
						break;
	}
	mesh.rotation.x =  Math.PI / 180 * (-90);
	mesh.position.set(x, y, z);
	//scene.add(mesh);
	mesh.updateMatrix();
	combined_mesh.merge(mesh.geometry, mesh.matrix);
	index_tile++;
}

function studyVertices(geometry, study) {
	var vertex = new Array();
	console.log(geometry);
	switch (study) {
		case "c":	{
						for(i = 0; i < geometry.vertices.length; i++) {
							if ((geometry.vertices[i].y === geometry.boundingBox.min.y) && (geometry.vertices[i].z != 0))
								vertex.push(i);			
						}
						console.log(vertex);
						for(i = 0; i < vertex.length; i++)
						console.log(geometry.vertices[vertex[i]]);
						break;	
					}
		case "s":	{
						/*
							Study north vertices of south mesh.
						*/
						for(i = 0; i < geometry.vertices.length; i++) {
							if ((geometry.vertices[i].y === geometry.boundingBox.max.y) && (geometry.vertices[i].z != 0))
								vertex.push(i);			
						}
						console.log(vertex);
						for(i = 0; i < vertex.length; i++)
						console.log(geometry.vertices[vertex[i]]);
						break;	
					}
	}
	
			
}

/*
function showGeometries(info_tiles) {
	for(i = 0; i < info_tiles.length; i++) {
		switch (info_tiles[i].cardinality) {
			case "c":	createMesh(0, 0, 0, info_tiles[i].x, info_tiles[i].y, sessionStorage.name + i + info_tiles[i].cardinality);
						break;
			case "s":	createMesh(0, 0, 33, info_tiles[i].x, info_tiles[i].y, sessionStorage.name + i + info_tiles[i].cardinality);
						break;
			case "n":	createMesh(0, 0, -33, info_tiles[i].x, info_tiles[i].y, sessionStorage.name + i + info_tiles[i].cardinality);
						break;
			case "w":	createMesh(-33, 0, 0, info_tiles[i].x, info_tiles[i].y, sessionStorage.name + i + info_tiles[i].cardinality);
						break;
			case "e":	createMesh(33, 0, 0, info_tiles[i].x, info_tiles[i].y, sessionStorage.name + i + info_tiles[i].cardinality);
						break;
		}	
	}
}
*/
	
	