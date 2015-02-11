/* Functions */
/*
	Function returns all mesh to the rute gpx and information about mesh cesium.
*/
function checkTile(coord) {
		var i, j,positionLonLat, positionTileXY, tile;
		positionLonLat = Cesium.Cartographic.fromDegrees(coord[0][1], coord[0][0]);
		positionTileXY = aCesiumTerrainProvider.tilingScheme.positionToTileXY(positionLonLat,12);
		tile = getTile(positionTileXY);
		info_tiles.push(new InfoTile(positionTileXY.x, positionTileXY.y, "c",tile.northwest.latitude, tile.northwest.longitude, tile.southeast.latitude, tile.southeast.longitude, coord[0][1], coord[0][0], 0));
		for (i = 1; i < coord.length; i ++) {
			var positionLonLat_actual, positionTileXY_actual;
			positionLonLat_actual = Cesium.Cartographic.fromDegrees(coord[i][1], coord[i][0]);
			positionTileXY_actual = aCesiumTerrainProvider.tilingScheme.positionToTileXY(positionLonLat_actual,12);
			if ((positionTileXY.x != positionTileXY_actual.x) || (positionTileXY.y != positionTileXY_actual.y)) {
				tile = getTile(positionTileXY_actual);
				if (positionTileXY.x < positionTileXY_actual.x)
					info_tiles.push(new InfoTile(positionTileXY_actual.x, positionTileXY_actual.y, "w",tile.northwest.latitude, tile.northwest.longitude, tile.southeast.latitude, tile.southeast.longitude, coord[i][1], coord[i][0], i));
				else if (positionTileXY.x > positionTileXY_actual.x)	
					info_tiles.push(new InfoTile(positionTileXY_actual.x, positionTileXY_actual.y, "e",tile.northwest.latitude, tile.northwest.longitude, tile.southeast.latitude, tile.southeast.longitude, coord[i][1], coord[i][0], i));
				else if (positionTileXY.y < positionTileXY_actual.y)
					info_tiles.push(new InfoTile(positionTileXY_actual.x, positionTileXY_actual.y, "s",tile.northwest.latitude, tile.northwest.longitude, tile.southeast.latitude, tile.southeast.longitude, coord[i][1], coord[i][0], i));
				else if (positionTileXY.y > positionTileXY_actual.y)
					info_tiles.push(new InfoTile(positionTileXY_actual.x, positionTileXY_actual.y, "n",tile.northwest.latitude, tile.northwest.longitude, tile.southeast.latitude, tile.southeast.longitude, coord[i][1], coord[i][0], i));
				positionTileXY = positionTileXY_actual;
			}
		}
		
		/*
			Remove repeat elements.
		*/
		
		var info_tiles_clone = info_tiles;
		for(i = 0; i < info_tiles_clone.length; i++) {
			var actual = info_tiles_clone[i];
			var pos = new Array();
			for(j = 0; j < info_tiles.length; j++){
				if ((actual.x == info_tiles[j].x) && (actual.y == info_tiles[j].y))
					pos.push(j);
			}
			/*
				is j=1 because the first never remove.
			*/
			for(j = 1; j < pos.length; j++)
				info_tiles.splice(pos[j],1);
		}
		/*
			Compare the two last.
		*/
		if (info_tiles.length > 1) 
			if ((info_tiles[info_tiles.length-1].x == info_tiles[info_tiles.length-2].x) && (info_tiles[info_tiles.length-1].y == info_tiles[info_tiles.length-2].y)) {
				info_tiles.splice(info_tiles.length-1,1);
			}
		//info_tiles.splice(info_tiles.length-1, 1);
		
		/*
		for(i = 0; i < info_tiles.length; i++) {
			var bounds = [[info_tiles[i].bounds[0][0], info_tiles[i].bounds[0][1]], [info_tiles[i].bounds[1][0], info_tiles[i].bounds[1][1]]];
			L.rectangle(bounds, {color: "#191414", weight: 2, fillOpacity:0 }).addTo(map);
		}
		*/
		
}
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
/*
	Create a mesh in position (x,y,z) from a tile.
*/
function createMesh(x, y, z, pos_x, pos_y, mapbox_texture) {
		aCesiumTerrainProvider.requestTileGeometry(pos_x, pos_y, 12, true).then(function(data){
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
			//geometry = addFaceVertexUvs(geometry);
			geometry = addBase(geometry);
			geometry = addFaceVertexUvs(geometry);
			var texture = THREE.ImageUtils.loadTexture( "./textures/"+ mapbox_texture +".png" );
			var material= new THREE.MeshBasicMaterial( { map: texture, wireframe: true, side:THREE.DoubleSide } );
			//var material= new THREE.MeshBasicMaterial( { color: "rgb(255,0,0)", wireframe: true ,side:THREE.DoubleSide} );
			material.needsUpdate = true;
			geometry.buffersNeedUpdate = true;
			geometry.uvsNeedUpdate = true;
			mesh = new THREE.Mesh( geometry, material );
			mesh.rotation.x =  Math.PI / 180 * (-90);
			mesh.position.set(x, y, z);
			scene.add(mesh);
		});
}
/*
	Function to addVertexUVs to apply texture in mesh.
*/
function addFaceVertexUvs(geometry) {
	geometry.computeBoundingBox();
	var max = geometry.boundingBox.max,
		min = geometry.boundingBox.min;
	var offset = new THREE.Vector2(0 - min.x, 0 - min.y);
	var range = new THREE.Vector2(max.x - min.x, max.y - min.y);
	geometry.faceVertexUvs[0] = [];
	for (i = 0; i < geometry.faces.length ; i++) {
		var v1 = geometry.vertices[geometry.faces[i].a], v2 = geometry.vertices[geometry.faces[i].b], v3 = geometry.vertices[geometry.faces[i].c];
		geometry.faceVertexUvs[0].push(
		[
			new THREE.Vector2((v1.x + offset.x)/range.x ,(v1.y + offset.y)/range.y),
			new THREE.Vector2((v2.x + offset.x)/range.x ,(v2.y + offset.y)/range.y),
			new THREE.Vector2((v3.x + offset.x)/range.x ,(v3.y + offset.y)/range.y)
		]);

	}
	geometry.uvsNeedUpdate = true;
	return geometry;
}
/*
	Function Sort Vector to Base.
*/
function sortVector(geometry, vertices, coordinate) {
	var index_aux, control = true, i;
	if(coordinate == "y") {
		while(control) {
			control = false;
			for(var i=0; i < vertices.length-1; i++) {
				if (geometry.vertices[vertices[i]].y > geometry.vertices[vertices[i+1]].y) {
					index_aux = vertices[i+1];
					vertices[i+1] = vertices[i];
					vertices[i] = index_aux;
					control = true;
				}
			}
		}		
	} else if(coordinate == "x") {
		while(control) {
			control = false;
			for(var i=0; i < vertices.length-1; i++) {
				if (geometry.vertices[vertices[i]].x > geometry.vertices[vertices[i+1]].x) {
					index_aux = vertices[i+1];
					vertices[i+1] = vertices[i];
					vertices[i] = index_aux;
					control = true;
				}
			}
		}
	}
	return vertices;
}
/*
	Draw faces relieve.
*/
function addRelieve(geometry, vertices, displace) {
	for(var i = 0; i < vertices.length-1; i++){
		geometry.faces.push(new THREE.Face3(vertices[i], vertices[i]+displace, vertices[i+1]+displace));
		geometry.faces.push(new THREE.Face3(vertices[i+1], vertices[i], vertices[i+1]+displace));
	}
}
/*
	Add base to geometry.
*/
function addBase(geometry){
	/*
		Add to geometry her base.
	*/
	//In geometry2 have the old data of geometry.
	var geometry2 = geometry.clone();
	for(var i = 0; i < geometry2.vertices.length; i++) {
		geometry.vertices.push(new THREE.Vector3(geometry2.vertices[i].x, geometry2.vertices[i].y, 0));
	}
	var southVertices = new Array(), northVertices = new Array(), eastVertices = new Array(), westVertices = new Array(), i;
	//Save the index of the limits(west, east, north, south).
	geometry2.computeBoundingBox();
	// Vertices of mesh.
	for(i = 0; i < geometry2.vertices.length; i++) {
		if (geometry.vertices[i].y === geometry2.boundingBox.min.y)
			southVertices.push(i);			
		else if (geometry.vertices[i].x === geometry2.boundingBox.min.x)
			westVertices.push(i);
		else if (geometry.vertices[i].x === geometry2.boundingBox.max.x)
			eastVertices.push(i);	
		else if (geometry.vertices[i].y === geometry2.boundingBox.max.y)
			northVertices.push(i);	
	}
	//displace, value to fin her vector.-alue in the base.
	var displace = geometry2.vertices.length;
	//Sort vertices to draw faces correctly.
	southVertices = sortVector(geometry2, southVertices, "x");
	westVertices = sortVector(geometry2, westVertices, "y");
	eastVertices = sortVector(geometry2, eastVertices, "y");
	northVertices = sortVector(geometry2, northVertices, "x");
	//Add the faces.
	addRelieve(geometry, southVertices, displace);
	addRelieve(geometry, westVertices, displace);
	addRelieve(geometry, eastVertices, displace);
	addRelieve(geometry, northVertices, displace);
	/*
		West and east miss a point and north two point.
	*/
	//West-south
	geometry.faces.push(new THREE.Face3(westVertices[0], westVertices[0]+displace, southVertices[0]+displace));
	geometry.faces.push(new THREE.Face3(southVertices[0], westVertices[0], southVertices[0]+displace));
	//East-south
	geometry.faces.push(new THREE.Face3(eastVertices[0], eastVertices[0]+displace, southVertices[southVertices.length-1]+displace));
	geometry.faces.push(new THREE.Face3(southVertices[southVertices.length-1], eastVertices[0], southVertices[southVertices.length-1]+displace));
	//North-West 
	geometry.faces.push(new THREE.Face3(westVertices[westVertices.length-1], westVertices[westVertices.length-1]+displace, northVertices[0]+displace));
	geometry.faces.push(new THREE.Face3(northVertices[0], westVertices[westVertices.length-1], northVertices[0]+displace));
	//North-East
	geometry.faces.push(new THREE.Face3(eastVertices[eastVertices.length-1], eastVertices[eastVertices.length-1]+displace, northVertices[northVertices.length-1]+displace));
	geometry.faces.push(new THREE.Face3(northVertices[northVertices.length-1], eastVertices[eastVertices.length-1], northVertices[northVertices.length-1]+displace));
	/*add Base goemtry*/
	geometry.faces.push(new THREE.Face3(southVertices[0]+displace, eastVertices[eastVertices.length-1]+displace, southVertices[southVertices.length-1]+displace));
	geometry.faces.push(new THREE.Face3(southVertices[0]+displace, westVertices[westVertices.length-1]+displace, eastVertices[eastVertices.length-1]+displace));
	
	return geometry;
}
/*
	FUNCTION radians to degrees.
*/
function radianToDegrees(radians) {
	return (radians * 180)/ Math.PI;	
}
/*
	FUNCTION create a Tile Cesium Rectangle with vertices in degrees[latitude and longitude].
	sw: SouthWest, se:SouthEast, nw: NorthWest, ne:NorthEast. 
*/
function getTile(positionTileXY) {
	var myTile, sw, se, nw, ne;;
	var rectangleTileXY = aCesiumTerrainProvider.tilingScheme.tileXYToRectangle(positionTileXY.x, positionTileXY.y, 12);
	sw = new Coordinate(radianToDegrees(Cesium.Rectangle.southwest(rectangleTileXY).latitude),radianToDegrees(Cesium.Rectangle.southwest(rectangleTileXY).longitude));
	se = new Coordinate(radianToDegrees(Cesium.Rectangle.southeast(rectangleTileXY).latitude),radianToDegrees(Cesium.Rectangle.southeast(rectangleTileXY).longitude));
	nw = new Coordinate(radianToDegrees(Cesium.Rectangle.northwest(rectangleTileXY).latitude),radianToDegrees(Cesium.Rectangle.northwest(rectangleTileXY).longitude));
	ne = new Coordinate(radianToDegrees(Cesium.Rectangle.northeast(rectangleTileXY).latitude),radianToDegrees(Cesium.Rectangle.northeast(rectangleTileXY).longitude));
	myTile = new Tile(ne, se, nw, sw);
	return myTile;
}