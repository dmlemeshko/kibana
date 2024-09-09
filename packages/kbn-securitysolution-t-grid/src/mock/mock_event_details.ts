/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

export const eventHit = {
  _index: 'auditbeat-7.8.0-2020.11.05-000003',
  _id: 'tkCt1nUBaEgqnrVSZ8R_',
  _score: 0,
  _type: '',
  fields: {
    'event.category': ['process'],
    'process.ppid': [3977],
    'user.name': ['jenkins'],
    'process.args': ['go', 'vet', './...'],
    message: ['Process go (PID: 4313) by user jenkins STARTED'],
    'process.pid': [4313],
    'process.working_directory': [
      '/var/lib/jenkins/workspace/Beats_beats_PR-22624/src/github.com/elastic/beats/libbeat',
    ],
    'process.entity_id': ['Z59cIkAAIw8ZoK0H'],
    'host.ip': ['10.224.1.237', 'fe80::4001:aff:fee0:1ed', '172.17.0.1'],
    'process.name': ['go'],
    'event.action': ['process_started'],
    'agent.type': ['auditbeat'],
    '@timestamp': ['2020-11-17T14:48:08.922Z'],
    'event.module': ['system'],
    'event.type': ['start'],
    'host.name': ['beats-ci-immutable-ubuntu-1804-1605624279743236239'],
    'process.hash.sha1': ['1eac22336a41e0660fb302add9d97daa2bcc7040'],
    'host.os.family': ['debian'],
    'event.kind': ['event'],
    'host.id': ['e59991e835905c65ed3e455b33e13bd6'],
    'event.dataset': ['process'],
    'process.executable': [
      '/var/lib/jenkins/workspace/Beats_beats_PR-22624/.gvm/versions/go1.14.7.linux.amd64/bin/go',
    ],
    'source.geo.location': [{ coordinates: [118.7778, 32.0617], type: 'Point' }],
    'threat.enrichments': [
      {
        'matched.field': ['matched_field', 'other_matched_field'],
        'indicator.first_seen': ['2021-02-22T17:29:25.195Z'],
        'indicator.provider': ['yourself'],
        'indicator.type': ['custom'],
        'matched.atomic': ['matched_atomic'],
        lazer: [
          {
            'great.field': ['grrrrr'],
          },
          {
            'great.field': ['grrrrr_2'],
          },
        ],
      },
      {
        'matched.field': ['matched_field_2'],
        'indicator.first_seen': ['2021-02-22T17:29:25.195Z'],
        'indicator.provider': ['other_you'],
        'indicator.type': ['custom'],
        'matched.atomic': ['matched_atomic_2'],
        lazer: [
          {
            'great.field': [
              {
                wowoe: [
                  {
                    fooooo: ['grrrrr'],
                  },
                ],
                astring: 'cool',
                aNumber: 1,
                neat: true,
              },
            ],
          },
        ],
      },
      {
        'matched.field': ['host.name'],
        'matched.index': ['im'],
        'matched.type': ['indicator_match_rule'],
        'matched.id': ['FFEtSYIBZ61VHL7LvV2j'],
        'matched.atomic': ['MacBook-Pro-de-Gloria.local'],
      },
      {
        'matched.field': ['host.hostname'],
        'matched.index': ['im'],
        'matched.type': ['indicator_match_rule'],
        'matched.id': ['E1EtSYIBZ61VHL7Ltl3m'],
        'matched.atomic': ['MacBook-Pro-de-Gloria.local'],
      },
      {
        'matched.field': ['host.architecture'],
        'matched.index': ['im'],
        'matched.type': ['indicator_match_rule'],
        'matched.id': ['E1EtSYIBZ61VHL7Ltl3m'],
        'matched.atomic': ['x86_64'],
      },
      {
        'matched.field': ['host.name'],
        'matched.index': ['im'],
        'matched.type': ['indicator_match_rule'],
        'matched.id': ['E1EtSYIBZ61VHL7Ltl3m'],
        'matched.atomic': ['MacBook-Pro-de-Gloria.local'],
      },
      {
        'matched.field': ['host.hostname'],
        'matched.index': ['im'],
        'matched.type': ['indicator_match_rule'],
        'matched.id': ['CFErSYIBZ61VHL7LIV1N'],
        'matched.atomic': ['MacBook-Pro-de-Gloria.local'],
      },
    ],
  },
  _source: {},
  sort: ['1605624488922', 'beats-ci-immutable-ubuntu-1804-1605624279743236239'],
  aggregations: {},
};

export const eventDetailsFormattedFields = [
  {
    category: 'event',
    field: 'event.category',
    isObjectArray: false,
    originalValue: ['process'],
    values: ['process'],
  },
  {
    category: 'process',
    field: 'process.ppid',
    isObjectArray: false,
    originalValue: ['3977'],
    values: ['3977'],
  },
  {
    category: 'user',
    field: 'user.name',
    isObjectArray: false,
    originalValue: ['jenkins'],
    values: ['jenkins'],
  },
  {
    category: 'process',
    field: 'process.args',
    isObjectArray: false,
    originalValue: ['go', 'vet', './...'],
    values: ['go', 'vet', './...'],
  },
  {
    category: 'base',
    field: 'message',
    isObjectArray: false,
    originalValue: ['Process go (PID: 4313) by user jenkins STARTED'],
    values: ['Process go (PID: 4313) by user jenkins STARTED'],
  },
  {
    category: 'process',
    field: 'process.pid',
    isObjectArray: false,
    originalValue: ['4313'],
    values: ['4313'],
  },
  {
    category: 'process',
    field: 'process.working_directory',
    isObjectArray: false,
    originalValue: [
      '/var/lib/jenkins/workspace/Beats_beats_PR-22624/src/github.com/elastic/beats/libbeat',
    ],
    values: [
      '/var/lib/jenkins/workspace/Beats_beats_PR-22624/src/github.com/elastic/beats/libbeat',
    ],
  },
  {
    category: 'process',
    field: 'process.entity_id',
    isObjectArray: false,
    originalValue: ['Z59cIkAAIw8ZoK0H'],
    values: ['Z59cIkAAIw8ZoK0H'],
  },
  {
    category: 'host',
    field: 'host.ip',
    isObjectArray: false,
    originalValue: ['10.224.1.237', 'fe80::4001:aff:fee0:1ed', '172.17.0.1'],
    values: ['10.224.1.237', 'fe80::4001:aff:fee0:1ed', '172.17.0.1'],
  },
  {
    category: 'process',
    field: 'process.name',
    isObjectArray: false,
    originalValue: ['go'],
    values: ['go'],
  },
  {
    category: 'event',
    field: 'event.action',
    isObjectArray: false,
    originalValue: ['process_started'],
    values: ['process_started'],
  },
  {
    category: 'agent',
    field: 'agent.type',
    isObjectArray: false,
    originalValue: ['auditbeat'],
    values: ['auditbeat'],
  },
  {
    category: 'base',
    field: '@timestamp',
    isObjectArray: false,
    originalValue: ['2020-11-17T14:48:08.922Z'],
    values: ['2020-11-17T14:48:08.922Z'],
  },
  {
    category: 'event',
    field: 'event.module',
    isObjectArray: false,
    originalValue: ['system'],
    values: ['system'],
  },
  {
    category: 'event',
    field: 'event.type',
    isObjectArray: false,
    originalValue: ['start'],
    values: ['start'],
  },
  {
    category: 'host',
    field: 'host.name',
    isObjectArray: false,
    originalValue: ['beats-ci-immutable-ubuntu-1804-1605624279743236239'],
    values: ['beats-ci-immutable-ubuntu-1804-1605624279743236239'],
  },
  {
    category: 'process',
    field: 'process.hash.sha1',
    isObjectArray: false,
    originalValue: ['1eac22336a41e0660fb302add9d97daa2bcc7040'],
    values: ['1eac22336a41e0660fb302add9d97daa2bcc7040'],
  },
  {
    category: 'host',
    field: 'host.os.family',
    isObjectArray: false,
    originalValue: ['debian'],
    values: ['debian'],
  },
  {
    category: 'event',
    field: 'event.kind',
    isObjectArray: false,
    originalValue: ['event'],
    values: ['event'],
  },
  {
    category: 'host',
    field: 'host.id',
    isObjectArray: false,
    originalValue: ['e59991e835905c65ed3e455b33e13bd6'],
    values: ['e59991e835905c65ed3e455b33e13bd6'],
  },
  {
    category: 'event',
    field: 'event.dataset',
    isObjectArray: false,
    originalValue: ['process'],
    values: ['process'],
  },
  {
    category: 'process',
    field: 'process.executable',
    isObjectArray: false,
    originalValue: [
      '/var/lib/jenkins/workspace/Beats_beats_PR-22624/.gvm/versions/go1.14.7.linux.amd64/bin/go',
    ],
    values: [
      '/var/lib/jenkins/workspace/Beats_beats_PR-22624/.gvm/versions/go1.14.7.linux.amd64/bin/go',
    ],
  },
  {
    category: 'source',
    field: 'source.geo.location',
    isObjectArray: true,
    originalValue: [`{"lon":118.7778,"lat":32.0617}`],
    values: [`{"lon":118.7778,"lat":32.0617}`],
  },
  {
    category: 'threat',
    field: 'threat.enrichments.matched.field',
    isObjectArray: false,
    originalValue: [
      'matched_field',
      'other_matched_field',
      'matched_field_2',
      'host.name',
      'host.hostname',
      'host.architecture',
    ],
    values: [
      'matched_field',
      'other_matched_field',
      'matched_field_2',
      'host.name',
      'host.hostname',
      'host.architecture',
    ],
  },
  {
    category: 'threat',
    field: 'threat.enrichments.indicator.first_seen',
    isObjectArray: false,
    originalValue: ['2021-02-22T17:29:25.195Z'],
    values: ['2021-02-22T17:29:25.195Z'],
  },
  {
    category: 'threat',
    field: 'threat.enrichments.indicator.provider',
    isObjectArray: false,
    originalValue: ['yourself', 'other_you'],
    values: ['yourself', 'other_you'],
  },
  {
    category: 'threat',
    field: 'threat.enrichments.indicator.type',
    isObjectArray: false,
    originalValue: ['custom'],
    values: ['custom'],
  },
  {
    category: 'threat',
    field: 'threat.enrichments.matched.atomic',
    isObjectArray: false,
    originalValue: ['matched_atomic', 'matched_atomic_2', 'MacBook-Pro-de-Gloria.local', 'x86_64'],
    values: ['matched_atomic', 'matched_atomic_2', 'MacBook-Pro-de-Gloria.local', 'x86_64'],
  },
  {
    category: 'threat',
    field: 'threat.enrichments.lazer',
    isObjectArray: true,
    originalValue: [
      '{"great.field":["grrrrr"]}',
      '{"great.field":["grrrrr_2"]}',
      '{"great.field":[{"wowoe":[{"fooooo":["grrrrr"]}],"astring":"cool","aNumber":1,"neat":true}]}',
    ],
    values: [
      '{"great.field":["grrrrr"]}',
      '{"great.field":["grrrrr_2"]}',
      '{"great.field":[{"wowoe":[{"fooooo":["grrrrr"]}],"astring":"cool","aNumber":1,"neat":true}]}',
    ],
  },
  {
    category: 'threat',
    field: 'threat.enrichments.matched.index',
    isObjectArray: false,
    originalValue: ['im'],
    values: ['im'],
  },
  {
    category: 'threat',
    field: 'threat.enrichments.matched.type',
    isObjectArray: false,
    originalValue: ['indicator_match_rule'],
    values: ['indicator_match_rule'],
  },
  {
    category: 'threat',
    field: 'threat.enrichments.matched.id',
    isObjectArray: false,
    originalValue: ['FFEtSYIBZ61VHL7LvV2j', 'E1EtSYIBZ61VHL7Ltl3m', 'CFErSYIBZ61VHL7LIV1N'],
    values: ['FFEtSYIBZ61VHL7LvV2j', 'E1EtSYIBZ61VHL7Ltl3m', 'CFErSYIBZ61VHL7LIV1N'],
  },
  {
    category: 'threat',
    field: 'threat.enrichments',
    isObjectArray: true,
    originalValue: [
      '{"matched.field":["matched_field","other_matched_field"],"indicator.first_seen":["2021-02-22T17:29:25.195Z"],"indicator.provider":["yourself"],"indicator.type":["custom"],"matched.atomic":["matched_atomic"],"lazer":[{"great.field":["grrrrr"]},{"great.field":["grrrrr_2"]}]}',
      '{"matched.field":["matched_field_2"],"indicator.first_seen":["2021-02-22T17:29:25.195Z"],"indicator.provider":["other_you"],"indicator.type":["custom"],"matched.atomic":["matched_atomic_2"],"lazer":[{"great.field":[{"wowoe":[{"fooooo":["grrrrr"]}],"astring":"cool","aNumber":1,"neat":true}]}]}',
      '{"matched.field":["host.name"],"matched.index":["im"],"matched.type":["indicator_match_rule"],"matched.id":["FFEtSYIBZ61VHL7LvV2j"],"matched.atomic":["MacBook-Pro-de-Gloria.local"]}',
      '{"matched.field":["host.hostname"],"matched.index":["im"],"matched.type":["indicator_match_rule"],"matched.id":["E1EtSYIBZ61VHL7Ltl3m"],"matched.atomic":["MacBook-Pro-de-Gloria.local"]}',
      '{"matched.field":["host.architecture"],"matched.index":["im"],"matched.type":["indicator_match_rule"],"matched.id":["E1EtSYIBZ61VHL7Ltl3m"],"matched.atomic":["x86_64"]}',
      '{"matched.field":["host.name"],"matched.index":["im"],"matched.type":["indicator_match_rule"],"matched.id":["E1EtSYIBZ61VHL7Ltl3m"],"matched.atomic":["MacBook-Pro-de-Gloria.local"]}',
      '{"matched.field":["host.hostname"],"matched.index":["im"],"matched.type":["indicator_match_rule"],"matched.id":["CFErSYIBZ61VHL7LIV1N"],"matched.atomic":["MacBook-Pro-de-Gloria.local"]}',
    ],
    values: [
      '{"matched.field":["matched_field","other_matched_field"],"indicator.first_seen":["2021-02-22T17:29:25.195Z"],"indicator.provider":["yourself"],"indicator.type":["custom"],"matched.atomic":["matched_atomic"],"lazer":[{"great.field":["grrrrr"]},{"great.field":["grrrrr_2"]}]}',
      '{"matched.field":["matched_field_2"],"indicator.first_seen":["2021-02-22T17:29:25.195Z"],"indicator.provider":["other_you"],"indicator.type":["custom"],"matched.atomic":["matched_atomic_2"],"lazer":[{"great.field":[{"wowoe":[{"fooooo":["grrrrr"]}],"astring":"cool","aNumber":1,"neat":true}]}]}',
      '{"matched.field":["host.name"],"matched.index":["im"],"matched.type":["indicator_match_rule"],"matched.id":["FFEtSYIBZ61VHL7LvV2j"],"matched.atomic":["MacBook-Pro-de-Gloria.local"]}',
      '{"matched.field":["host.hostname"],"matched.index":["im"],"matched.type":["indicator_match_rule"],"matched.id":["E1EtSYIBZ61VHL7Ltl3m"],"matched.atomic":["MacBook-Pro-de-Gloria.local"]}',
      '{"matched.field":["host.architecture"],"matched.index":["im"],"matched.type":["indicator_match_rule"],"matched.id":["E1EtSYIBZ61VHL7Ltl3m"],"matched.atomic":["x86_64"]}',
      '{"matched.field":["host.name"],"matched.index":["im"],"matched.type":["indicator_match_rule"],"matched.id":["E1EtSYIBZ61VHL7Ltl3m"],"matched.atomic":["MacBook-Pro-de-Gloria.local"]}',
      '{"matched.field":["host.hostname"],"matched.index":["im"],"matched.type":["indicator_match_rule"],"matched.id":["CFErSYIBZ61VHL7LIV1N"],"matched.atomic":["MacBook-Pro-de-Gloria.local"]}',
    ],
  },
];
