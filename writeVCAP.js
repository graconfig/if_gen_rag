import fs from 'fs';

fs.writeFileSync('./default-env.json',process.env.VCAP_SERVICES);