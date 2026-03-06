const officeParser = require('officeparser');
const path = require('path');

async function test() {
    try {
        console.log('OfficeParser imported:', Object.keys(officeParser));
    } catch (e) {
        console.error('Test failed:', e);
    }
}

test();
