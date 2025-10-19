import fs from 'node:fs/promises';
import { IExecDataProtectorDeserializer } from '@iexec/dataprotector-deserializer';

const main = async () => {
  const { IEXEC_OUT } = process.env;

  let computedJsonObj = {};

  try {
    // Read protected data produced by Splitwise protectMembers
    // Expected shape: { members: { "0": "0x...", "1": "0x...", ... } }
    let members = {};
    try {
      const deserializer = new IExecDataProtectorDeserializer();
      // Try to retrieve the members object directly
      members = await deserializer.getValue('members', 'object');
      console.log('Protected members object found');
    } catch (e) {
      console.log('Could not read members from protected data:', e);
      // Fallback: read indexed keys members.0, members.1, ...
      try {
        const deserializer = new IExecDataProtectorDeserializer();
        const collected = {};
        for (let i = 0; i < 100; i++) {
          try {
            const v = await deserializer.getValue(`members.${i}`, 'string');
            collected[String(i)] = v;
          } catch (_) {
            break;
          }
        }
        if (Object.keys(collected).length > 0) {
          members = collected;
          console.log('Collected members from indexed keys');
        }
      } catch (e2) {
        console.log('Indexed fallback failed:', e2);
      }
    }

    const { IEXEC_APP_DEVELOPER_SECRET } = process.env;
    if (IEXEC_APP_DEVELOPER_SECRET) {
      const redactedAppSecret = IEXEC_APP_DEVELOPER_SECRET.replace(/./g, '*');
      console.log(`Got an app secret (${redactedAppSecret})!`);
    } else {
      console.log(`App secret is not set`);
    }

    const { IEXEC_REQUESTER_SECRET_1, IEXEC_REQUESTER_SECRET_42 } = process.env;
    if (IEXEC_REQUESTER_SECRET_1) {
      const redactedRequesterSecret = IEXEC_REQUESTER_SECRET_1.replace(
        /./g,
        '*'
      );
      console.log(`Got requester secret 1 (${redactedRequesterSecret})!`);
    } else {
      console.log(`Requester secret 1 is not set`);
    }
    if (IEXEC_REQUESTER_SECRET_42) {
      const redactedRequesterSecret = IEXEC_REQUESTER_SECRET_42.replace(
        /./g,
        '*'
      );
      console.log(`Got requester secret 42 (${redactedRequesterSecret})!`);
    } else {
      console.log(`Requester secret 42 is not set`);
    }

    // Write JSON result for frontend consumption
    const resultObject = { members };
    await fs.writeFile(
      `${IEXEC_OUT}/result.json`,
      JSON.stringify(resultObject, null, 2)
    );

    // Build the "computed.json" object to point to JSON result
    computedJsonObj = {
      'deterministic-output-path': `${IEXEC_OUT}/result.json`,
    };
  } catch (e) {
    // Handle errors
    console.log(e);

    // Build the "computed.json" object with an error message
    computedJsonObj = {
      'deterministic-output-path': IEXEC_OUT,
      'error-message': 'Oops something went wrong',
    };
  } finally {
    // Save the "computed.json" file
    await fs.writeFile(
      `${IEXEC_OUT}/computed.json`,
      JSON.stringify(computedJsonObj)
    );
  }
};

main();
