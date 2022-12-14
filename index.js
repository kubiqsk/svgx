#!/usr/bin/env node

import { optimize, loadConfig } from 'svgo';
import trash from 'trash';
import {filesize} from 'filesize';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fs = require('fs');
const path = require('path');

const optimizeSVGs = async ( startPath ) => {
	if( ! fs.existsSync( startPath ) ){
		console.log( 'no dir ', startPath );
		return;
	}

	var files = fs.readdirSync( startPath );
	for( var i = 0; i < files.length; i++ ){
		var filename = path.join( startPath, files[i] );
		var stat = fs.lstatSync( filename );
		if( stat.isDirectory() ){
			optimizeSVGs( filename );
		}else if( filename.endsWith('.svg') ){
			const oldSize = filesize( stat.size );
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
													}
													if( node.attributes.height == null ){
														node.attributes.height = nums[3];
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
						'reusePaths'
					]
				}
			);

			await trash([ filename ]);

			fs.writeFileSync( filename, result.data );
			stat = fs.lstatSync( filename );
			console.log( oldSize, ' -> ', filesize( stat.size ) );
			console.log( '----' );
		}
	}
}

optimizeSVGs( process.cwd() );