import test from 'node:test';
import assert from 'node:assert/strict';
import { isSafeCoverUrl, validateImageUpload, MAX_IMAGE_BYTES } from '../api/_media.js';

test('https kapak bağlantıları kabul edilir', () => {
    assert.equal(isSafeCoverUrl('https://ornek.com/kapak.jpg'), 'https://ornek.com/kapak.jpg');
});

test('panelin yüklediği /api/media/ yolu kabul edilir', () => {
    assert.equal(isSafeCoverUrl('/api/media/media-1760000000000-ab12cd34'), '/api/media/media-1760000000000-ab12cd34');
});

test('http, javascript: ve dış path kapak bağlantıları reddedilir', () => {
    assert.equal(isSafeCoverUrl('http://ornek.com/a.png'), '');
    assert.equal(isSafeCoverUrl('javascript:alert(1)'), '');
    assert.equal(isSafeCoverUrl('/static/a.png'), '');
    assert.equal(isSafeCoverUrl(''), '');
    assert.equal(isSafeCoverUrl(null), '');
});

test('tırnak içeren bağlantılar reddedilir', () => {
    assert.equal(isSafeCoverUrl("https://ornek.com/a''),url(x)"), '');
});

test('geçerli base64 görsel yüklemesi kabul edilir', () => {
    const png = Buffer.from('89504e470d0a1a0a0000', 'hex').toString('base64');
    const r = validateImageUpload({ mime: 'image/png', data: png });
    assert.equal(r.ok, true);
    assert.equal(r.mime, 'image/png');
    assert.ok(Buffer.isBuffer(r.buffer));
});

test('data URL önekli base64 kabul edilir', () => {
    const r = validateImageUpload({ mime: 'image/jpeg', data: 'data:image/jpeg;base64,/9j/4AAQ' });
    assert.equal(r.ok, true);
    assert.equal(r.mime, 'image/jpeg');
});

test('izin verilmeyen MIME türleri reddedilir', () => {
    assert.equal(validateImageUpload({ mime: 'image/svg+xml', data: 'PHN2Zz4=' }).ok, false);
    assert.equal(validateImageUpload({ mime: 'text/html', data: 'PGI+' }).ok, false);
    assert.equal(validateImageUpload({ mime: '', data: 'AAAA' }).ok, false);
});

test('geçersiz base64 reddedilir', () => {
    assert.equal(validateImageUpload({ mime: 'image/png', data: 'bu base64 değil!' }).ok, false);
    assert.equal(validateImageUpload({ mime: 'image/png', data: '' }).ok, false);
    assert.equal(validateImageUpload({ mime: 'image/png' }).ok, false);
    assert.equal(validateImageUpload(null).ok, false);
});

test('2 MB sınırı aşan görseller reddedilir', () => {
    const big = Buffer.alloc(MAX_IMAGE_BYTES + 1024, 7).toString('base64');
    const r = validateImageUpload({ mime: 'image/png', data: big });
    assert.equal(r.ok, false);
    assert.match(r.error, /2 MB/);
});
