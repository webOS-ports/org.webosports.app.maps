/*
 * A small Mapbox Vector Tile encoder for test fixtures: enough of the
 * format (spec 2.1) for points, lines and simple polygons with string
 * properties.
 *
 *   encodeTile({place: [{type: 'point', at: [x, y], props: {name: 'A', class: 'city'}}],
 *               transportation_name: [{type: 'line', path: [[x, y], ...], props: {...}}],
 *               water: [{type: 'polygon', path: [[x, y], ...], props: {class: 'lake'}}]})
 *
 * Coordinates are in tile units of an extent of 4096.
 */
function varint(out, value) {
	while (value > 0x7f) {
		out.push((value & 0x7f) | 0x80);
		value = Math.floor(value / 128);
	}
	out.push(value);
}
function key(out, field, wire) {
	varint(out, (field << 3) | wire);
}
function bytes(out, field, data) {
	key(out, field, 2);
	varint(out, data.length);
	for (const b of data) out.push(b);
}
function string(out, field, text) {
	bytes(out, field, Array.from(Buffer.from(text, 'utf8')));
}
function uint(out, field, value) {
	key(out, field, 0);
	varint(out, value);
}
function packed(out, field, values) {
	const data = [];
	for (const v of values) varint(data, v);
	bytes(out, field, data);
}
const zigzag = (n) => (n << 1) ^ (n >> 31);

function geometry(feature) {
	const points = feature.type === 'point' ? [feature.at] : feature.path;
	const cmds = [];
	let x = 0, y = 0;
	points.forEach((p, i) => {
		if (i === 0) cmds.push((1 << 3) | 1);
		else if (i === 1) cmds.push(((points.length - 1) << 3) | 2);
		cmds.push(zigzag(p[0] - x), zigzag(p[1] - y));
		x = p[0];
		y = p[1];
	});
	/* a polygon ring is closed by a ClosePath command, its first point is not repeated */
	if (feature.type === 'polygon') cmds.push((1 << 3) | 7);
	return cmds;
}

function encodeLayer(name, features) {
	const keys = [], values = [];
	const index = (list, v) => {
		let i = list.indexOf(v);
		if (i < 0) { list.push(v); i = list.length - 1; }
		return i;
	};
	const out = [];
	uint(out, 15, 2);
	string(out, 1, name);
	features.forEach((f, n) => {
		const feature = [];
		uint(feature, 1, n + 1);
		const tags = [];
		for (const [k, v] of Object.entries(f.props || {})) tags.push(index(keys, k), index(values, String(v)));
		packed(feature, 2, tags);
		uint(feature, 3, {point: 1, line: 2, polygon: 3}[f.type]);
		packed(feature, 4, geometry(f));
		bytes(out, 2, feature);
	});
	for (const k of keys) string(out, 3, k);
	for (const v of values) {
		const value = [];
		string(value, 1, v);
		bytes(out, 4, value);
	}
	uint(out, 5, 4096);
	return out;
}

function encodeTile(layers) {
	const out = [];
	for (const [name, features] of Object.entries(layers)) bytes(out, 3, encodeLayer(name, features));
	const buffer = new Uint8Array(out);
	return buffer.buffer;
}

module.exports = {encodeTile};
