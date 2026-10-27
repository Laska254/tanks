import { BUILD_HASH, BUILT_AT } from './build-info';
import { PROTOCOL_VERSION } from './net/protocol-version';
import { startSpike } from './spike/two-dots';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('#app element missing');

startSpike(app);

// Corner label, so any device can tell which build it's running.
const build = document.createElement('div');
build.id = 'build';
build.textContent = BUILD_HASH;
build.title = `Built ${BUILT_AT}, protocol ${PROTOCOL_VERSION}`;
document.body.append(build);
