/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/solverse.json`.
 */
export type Solverse = {
  "address": "4kruCJtCQbxT1AQxZprCe7MfBVwFBJKYsdySz8ECPe6p",
  "metadata": {
    "name": "solverse",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "acceptTask",
      "discriminator": [
        222,
        196,
        79,
        165,
        120,
        30,
        38,
        120
      ],
      "accounts": [
        {
          "name": "participant",
          "writable": true,
          "signer": true
        },
        {
          "name": "creator"
        },
        {
          "name": "task",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  97,
                  115,
                  107
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              },
              {
                "kind": "arg",
                "path": "taskId"
              }
            ]
          }
        },
        {
          "name": "participation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  114,
                  116,
                  105,
                  99,
                  105,
                  112,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "task"
              },
              {
                "kind": "account",
                "path": "participant"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "taskId",
          "type": "string"
        }
      ]
    },
    {
      "name": "claimReward",
      "discriminator": [
        149,
        95,
        181,
        242,
        94,
        90,
        158,
        162
      ],
      "accounts": [
        {
          "name": "winner",
          "writable": true,
          "signer": true
        },
        {
          "name": "task",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  97,
                  115,
                  107
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              },
              {
                "kind": "arg",
                "path": "taskId"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "task"
              }
            ]
          }
        },
        {
          "name": "escrowVault",
          "writable": true
        },
        {
          "name": "winnerTokenAccount",
          "writable": true
        },
        {
          "name": "creator"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "taskId",
          "type": "string"
        }
      ]
    },
    {
      "name": "closeTask",
      "discriminator": [
        55,
        234,
        77,
        69,
        245,
        208,
        54,
        167
      ],
      "accounts": [
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "task",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  97,
                  115,
                  107
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              },
              {
                "kind": "arg",
                "path": "taskId"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "taskId",
          "type": "string"
        }
      ]
    },
    {
      "name": "createTask",
      "discriminator": [
        194,
        80,
        6,
        180,
        232,
        127,
        48,
        171
      ],
      "accounts": [
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "task",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  97,
                  115,
                  107
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              },
              {
                "kind": "arg",
                "path": "taskId"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "task"
              }
            ]
          }
        },
        {
          "name": "creatorTokenAccount",
          "writable": true
        },
        {
          "name": "escrowVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "escrow"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "rewardMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "rewardMint",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "taskId",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "rewardAmount",
          "type": "u64"
        },
        {
          "name": "duration",
          "type": "i64"
        }
      ]
    },
    {
      "name": "pickWinner",
      "discriminator": [
        227,
        62,
        25,
        73,
        132,
        106,
        68,
        96
      ],
      "accounts": [
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "task",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  97,
                  115,
                  107
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              },
              {
                "kind": "arg",
                "path": "taskId"
              }
            ]
          }
        },
        {
          "name": "submission",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  109,
                  105,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "task"
              },
              {
                "kind": "account",
                "path": "participant"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "task"
              }
            ]
          }
        },
        {
          "name": "participant"
        }
      ],
      "args": [
        {
          "name": "taskId",
          "type": "string"
        }
      ]
    },
    {
      "name": "refundEscrow",
      "discriminator": [
        107,
        186,
        89,
        99,
        26,
        194,
        23,
        204
      ],
      "accounts": [
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "task",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  97,
                  115,
                  107
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              },
              {
                "kind": "arg",
                "path": "taskId"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "task"
              }
            ]
          }
        },
        {
          "name": "escrowVault",
          "writable": true
        },
        {
          "name": "creatorTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "taskId",
          "type": "string"
        }
      ]
    },
    {
      "name": "submitWork",
      "discriminator": [
        158,
        80,
        101,
        51,
        114,
        130,
        101,
        253
      ],
      "accounts": [
        {
          "name": "participant",
          "writable": true,
          "signer": true
        },
        {
          "name": "creator"
        },
        {
          "name": "task",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  97,
                  115,
                  107
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              },
              {
                "kind": "arg",
                "path": "taskId"
              }
            ]
          }
        },
        {
          "name": "submission",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  109,
                  105,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "task"
              },
              {
                "kind": "account",
                "path": "participant"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "taskId",
          "type": "string"
        },
        {
          "name": "link",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "escrow",
      "discriminator": [
        31,
        213,
        123,
        187,
        186,
        22,
        218,
        155
      ]
    },
    {
      "name": "participation",
      "discriminator": [
        237,
        154,
        142,
        46,
        143,
        63,
        189,
        18
      ]
    },
    {
      "name": "submission",
      "discriminator": [
        58,
        194,
        159,
        158,
        75,
        102,
        178,
        197
      ]
    },
    {
      "name": "task",
      "discriminator": [
        79,
        34,
        229,
        55,
        88,
        90,
        55,
        84
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "taskEnded",
      "msg": "Task has ended"
    },
    {
      "code": 6001,
      "name": "taskNotEnded",
      "msg": "Task not ended yet"
    },
    {
      "code": 6002,
      "name": "noSubmissions",
      "msg": "No submissions"
    },
    {
      "code": 6003,
      "name": "alreadySubmitted",
      "msg": "Already submitted"
    },
    {
      "code": 6004,
      "name": "notCreator",
      "msg": "Not creator"
    },
    {
      "code": 6005,
      "name": "invalidWinner",
      "msg": "Invalid winner"
    },
    {
      "code": 6006,
      "name": "escrowMismatch",
      "msg": "Escrow mismatch"
    }
  ],
  "types": [
    {
      "name": "escrow",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "seed",
            "type": "string"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "rewardTokens",
            "type": "pubkey"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "endTime",
            "type": "i64"
          },
          {
            "name": "winner",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "participation",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "participant",
            "type": "pubkey"
          },
          {
            "name": "task",
            "type": "pubkey"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "participationStatus"
              }
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "participationStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "accepted"
          },
          {
            "name": "submitted"
          },
          {
            "name": "completed"
          }
        ]
      }
    },
    {
      "name": "submission",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "participant",
            "type": "pubkey"
          },
          {
            "name": "task",
            "type": "pubkey"
          },
          {
            "name": "link",
            "type": "string"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "task",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "taskId",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "reward",
            "type": "u64"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "endTime",
            "type": "i64"
          },
          {
            "name": "winner",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "submissionCount",
            "type": "u32"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
