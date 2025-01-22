#!/usr/bin/env node

import { optimize, loadConfig } from 'svgo';
import trash from 'trash';
import {filesize} from 'filesize';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fs = require('fs');
const path = require('path');

const getUniqueFilename = filePath => {
	let uniquePath = filePath;
	let counter = 1;
	while( fs.existsSync( uniquePath ) ){
		const { dir, name, ext } = path.parse( filePath );
		uniquePath = path.join( dir, `${name}_${counter}${ext}` );
		counter++;
	}
	return uniquePath;
}

const optimizeSVGs = async ( startPath ) => {
	if( ! fs.existsSync( startPath ) ){
		console.log( 'no dir ', startPath );
		return;
	}

	var widthHeightAdded = '';

	var files = fs.readdirSync( startPath );
	let i;
	for( i = 0; i < files.length; i++ ){
		if( files[i].substr( 0, 5 ) == 'svgx_' ) continue;
		widthHeightAdded = '';
		var filename = path.join( startPath, files[i] );
		var final_filename = getUniqueFilename( path.join( startPath, 'svgx_' + files[i] ) );
		var stat = fs.lstatSync( filename );
		if( stat.isDirectory() && process.argv.includes('-r') ){
			optimizeSVGs( filename );
		}else if( filename.endsWith('.svg') ){
			console.log( 'Optimizing ', files[i] );
			const result = optimize(
				fs.readFileSync( filename, 'utf8' ),
				{
					path: filename,
					multipass: true,
					pretty: false,
					gzip: false,
					transformPrecision: 5,
					floatPrecision: 5,
					plugins: [
						{
							name: 'preset-default',
							params: {
								overrides: {
									cleanupIds: true,
									cleanupAttrs: true,
									cleanupEnableBackground: true,
									cleanupNumericValues: true,
									collapseGroups: true,
									convertColors: true,
									convertEllipseToCircle: true,
									convertPathData: true,
									convertShapeToPath: true,
									convertTransform: true,
									inlineStyles: true,
									mergePaths: true,
									mergeStyles: true,
									minifyStyles: true,
									moveElemsAttrsToGroup: true,
									moveGroupAttrsToElems: false,
									removeComments: true,
									removeDesc: true,
									removeDoctype: true,
									removeEditorsNSData: true,
									removeEmptyAttrs: true,
									removeEmptyContainers: true,
									removeEmptyText: true,
									removeHiddenElems: true,
									removeMetadata: true,
									removeNonInheritableGroupAttrs: true,
									removeTitle: true,
									removeUnknownsAndDefaults: true,
									removeUnusedNS: true,
									removeUselessDefs: true,
									removeUselessStrokeAndFill: true,
									removeViewBox: false,
									removeXMLProcInst: true,
									sortAttrs: true,
									sortDefsChildren: true
								}
							}
						},
						{
							name: 'forceDimensions',
							description: 'add missing width and height attributes when possible',
							fn: () => {
								const viewBoxElems = [ 'svg', 'pattern', 'symbol' ];
								return {
									element: {
										enter: ( node, parentNode ) => {
											if( viewBoxElems.includes( node.name ) && node.attributes.viewBox != null && ( node.attributes.width == null || node.attributes.height == null ) ){
												if( node.name === 'svg' && parentNode.type !== 'root' ){
													return;
												}
												const nums = node.attributes.viewBox.split(/[ ,]+/g);
												if( nums[0] === '0' && nums[1] === '0' ){
													if( node.attributes.width == null ){
														node.attributes.width = nums[2];
														widthHeightAdded += 'width="' + nums[2] + '"';
													}
													if( node.attributes.height == null ){
														node.attributes.height = nums[3];
														widthHeightAdded += ' height="' + nums[3] + '"';
													}
												}
											}
										}
									}
								}
							}
						},
						'cleanupListOfValues',
						'convertStyleToAttrs',
						'removeRasterImages',
						'removeScriptElement',
						'reusePaths',
						{
							name: 'maybeRemoveSvgFill',
							description: 'remove fill attribute from svg tag if all child tags have a fill',
							fn: () => {
								const hasFillAttribute = ( node, isRootNode ) => {
									if( ! isRootNode ){
										if( ! node.attributes || ! node.attributes.fill ){
											return false;
										}
									}
									if( node.children ){
										if( ! isRootNode && node.attributes.fill ){
											return true;
										}else{
											for( let child of node.children ){
												if( ! hasFillAttribute( child, false ) ){
													return false;
												}
											}
										}
									}
									return true;
								};

								return {
									element: {
										enter: ( node, parentNode ) => {
											if( node.name == 'svg' && parentNode.type == 'root' && node.attributes.fill == 'none' ){
												let allDescendantsHaveFill = hasFillAttribute( node, true );
												if( allDescendantsHaveFill ){
													node.attributes.fill = '';
												}
											}
										}
									}
								}
							}
						}
					]
				}
			);

			const newSize = result.data.length;
			if( newSize <= stat.size || ( widthHeightAdded.length && newSize - stat.size <= widthHeightAdded.length + 2 ) ){ // maybe width and height was added, so it can have a few more bytes
				const oldSize = filesize( stat.size );
				await trash([ filename ]);
				fs.writeFileSync( final_filename, result.data );
				stat = fs.lstatSync( final_filename );
				console.log( oldSize, ' -> ', filesize( stat.size ) );
				console.log( '----' );
			}else{
				fs.renameSync( filename, final_filename );
				console.log( 'New file size is larger or equal to old file size. Skipping.' );
				console.log( '----' );
			}
		}
	}
}

optimizeSVGs( process.cwd() );