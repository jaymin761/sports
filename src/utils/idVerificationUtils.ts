import { AppConstants } from "./appConstants";

export let documentTypes: { [key: string]: any } = {
    "ZA": {
        id: 1,
        title: "South Africa",
        code: "ZA",
        types: {
            1: "South African ID",
        },
    },
    "IN": {
        id: 2,
        title: "India",
        code: "IN",
        types: {
            1: "Adhar Card",
            2: "Pan Card",
        },
    },
    "US": {
        id: 3,
        title: "USA",
        code: "US",
        types: {
            1: "SSN (Social Security Number)",
        },
    },
    "CN": {
        id: 4,
        title: "China",
        code: "CN",
        types: {
            1: "Chinese National Identity",
        },
    },
    "ID": {
        id: 5,
        title: "Indonesia",
        code: "ID",
        types: {},
    },
    "AF": {
        id: 6,
        title: "Afghanistan",
        code: "AF",
        types: {},
    },
    "AX": {
        id: 7,
        title: "Aland Islands",
        code: "AX",
        types: {},
    },
    "AL": {
        id: 8,
        title: "Albania",
        code: "AL",
        types: {},
    },
    "DZ": {
        id: 9,
        title: "Algeria",
        code: "DZ",
        types: {},
    },
    "AS": {
        id: 10,
        title: "American Samoa",
        code: "AS",
        types: {},
    },
    "AD": {
        id: 11,
        title: "Andorra",
        code: "AD",
        types: {},
    },
    "AO": {
        id: 12,
        title: "Angola",
        code: "AO",
        types: {},
    },
    "AI": {
        id: 13,
        title: "Anguilla",
        code: "AI",
        types: {},
    },
    "AQ": {
        id: 14,
        title: "Antarctica",
        code: "AQ",
        types: {},
    },
    "AG": {
        id: 15,
        title: "Antigua And Barbuda",
        code: "AG",
        types: {},
    },
    "AR": {
        id: 16,
        title: "Argentina",
        code: "AR",
        types: {},
    },
    "AM": {
        id: 17,
        title: "Armenia",
        code: "AM",
        types: {},
    },
    "AW": {
        id: 18,
        title: "Aruba",
        code: "AW",
        types: {},
    },
    "AU": {
        id: 19,
        title: "Australia",
        code: "AU",
        types: {},
    },
    "AT": {
        id: 20,
        title: "Austria",
        code: "AT",
        types: {},
    },
    "AZ": {
        id: 21,
        title: "Azerbaijan",
        code: "AZ",
        types: {},
    },
    "BS": {
        id: 22,
        title: "Bahamas The",
        code: "BS",
        types: {},
    },
    "BH": {
        id: 23,
        title: "Bahrain",
        code: "BH",
        types: {},
    },
    "BD": {
        id: 24,
        title: "Bangladesh",
        code: "BD",
        types: {},
    },
    "BB": {
        id: 25,
        title: "Barbados",
        code: "BB",
        types: {},
    },
    "BY": {
        id: 26,
        title: "Belarus",
        code: "BY",
        types: {},
    },
    "BE": {
        id: 27,
        title: "Belgium",
        code: "BE",
        types: {},
    },
    "BZ": {
        id: 28,
        title: "Belize",
        code: "BZ",
        types: {},
    },
    "BJ": {
        id: 29,
        title: "Benin",
        code: "BJ",
        types: {},
    },
    "BM": {
        id: 30,
        title: "Bermuda",
        code: "BM",
        types: {},
    },
    "BT": {
        id: 31,
        title: "Bhutan",
        code: "BT",
        types: {},
    },
    "BO": {
        id: 32,
        title: "Bolivia",
        code: "BO",
        types: {},
    },
    "BA": {
        id: 33,
        title: "Bosnia and Herzegovina",
        code: "BA",
        types: {},
    },
    "BW": {
        id: 34,
        title: "Botswana",
        code: "BW",
        types: {},
    },
    "BV": {
        id: 35,
        title: "Bouvet Island",
        code: "BV",
        types: {},
    },
    "BR": {
        id: 36,
        title: "Brazil",
        code: "BR",
        types: {},
    },
    "IO": {
        id: 37,
        title: "British Indian Ocean Territory",
        code: "IO",
        types: {},
    },
    "BN": {
        id: 38,
        title: "Brunei",
        code: "BN",
        types: {},
    },
    "BG": {
        id: 39,
        title: "Bulgaria",
        code: "BG",
        types: {},
    },
    "BF": {
        id: 40,
        title: "Burkina Faso",
        code: "BF",
        types: {},
    },
    "BI": {
        id: 41,
        title: "Burundi",
        code: "BI",
        types: {},
    },
    "KH": {
        id: 42,
        title: "Cambodia",
        code: "KH",
        types: {},
    },
    "CM": {
        id: 43,
        title: "Cameroon",
        code: "CM",
        types: {},
    },
    "CA": {
        id: 44,
        title: "Canada",
        code: "CA",
        types: {},
    },
    "CV": {
        id: 45,
        title: "Cape Verde",
        code: "CV",
        types: {},
    },
    "KY": {
        id: 46,
        title: "Cayman Islands",
        code: "KY",
        types: {},
    },
    "CF": {
        id: 47,
        title: "Central African Republic",
        code: "CF",
        types: {},
    },
    "TD": {
        id: 48,
        title: "Chad",
        code: "TD",
        types: {},
    },
    "CL": {
        id: 49,
        title: "Chile",
        code: "CL",
        types: {},
    },
    "CX": {
        id: 50,
        title: "Christmas Island",
        code: "CX",
        types: {},
    },
    "CC": {
        id: 51,
        title: "Cocos (Keeling) Islands",
        code: "CC",
        types: {},
    },
    "CO": {
        id: 52,
        title: "Colombia",
        code: "CO",
        types: {},
    },
    "KM": {
        id: 53,
        title: "Comoros",
        code: "KM",
        types: {},
    },
    "CG": {
        id: 54,
        title: "Congo",
        code: "CG",
        types: {},
    },
    "CD": {
        id: 55,
        title: "Democratic Republic of the Congo",
        code: "CD",
        types: {},
    },
    "CK": {
        id: 56,
        title: "Cook Islands",
        code: "CK",
        types: {},
    },
    "CR": {
        id: 57,
        title: "Costa Rica",
        code: "CR",
        types: {},
    },
    "CI": {
        id: 58,
        title: "Cote D'Ivoire (Ivory Coast)",
        code: "CI",
        types: {},
    },
    "HR": {
        id: 59,
        title: "Croatia",
        code: "HR",
        types: {},
    },
    "CU": {
        id: 60,
        title: "Cuba",
        code: "CU",
        types: {},
    },
    "CY": {
        id: 61,
        title: "Cyprus",
        code: "CY",
        types: {},
    },
    "CZ": {
        id: 62,
        title: "Czech Republic",
        code: "CZ",
        types: {},
    },
    "DK": {
        id: 63,
        title: "Denmark",
        code: "DK",
        types: {},
    },
    "DJ": {
        id: 64,
        title: "Djibouti",
        code: "DJ",
        types: {},
    },
    "DM": {
        id: 65,
        title: "Dominica",
        code: "DM",
        types: {},
    },
    "DO": {
        id: 66,
        title: "Dominican Republic",
        code: "DO",
        types: {},
    },
    "TL": {
        id: 67,
        title: "East Timor",
        code: "TL",
        types: {},
    },
    "EC": {
        id: 68,
        title: "Ecuador",
        code: "EC",
        types: {},
    },
    "EG": {
        id: 69,
        title: "Egypt",
        code: "EG",
        types: {},
    },
    "SV": {
        id: 70,
        title: "El Salvador",
        code: "SV",
        types: {},
    },
    "GQ": {
        id: 71,
        title: "Equatorial Guinea",
        code: "GQ",
        types: {},
    },
    "ER": {
        id: 72,
        title: "Eritrea",
        code: "ER",
        types: {},
    },
    "EE": {
        id: 73,
        title: "Estonia",
        code: "EE",
        types: {},
    },
    "ET": {
        id: 74,
        title: "Ethiopia",
        code: "ET",
        types: {},
    },
    "FK": {
        id: 75,
        title: "Falkland Islands",
        code: "FK",
        types: {},
    },
    "FO": {
        id: 76,
        title: "Faroe Islands",
        code: "FO",
        types: {},
    },
    "FJ": {
        id: 77,
        title: "Fiji Islands",
        code: "FJ",
        types: {},
    },
    "FI": {
        id: 78,
        title: "Finland",
        code: "FI",
        types: {},
    },
    "FR": {
        id: 79,
        title: "France",
        code: "FR",
        types: {},
    },
    "GF": {
        id: 80,
        title: "French Guiana",
        code: "GF",
        types: {},
    },
    "PF": {
        id: 81,
        title: "French Polynesia",
        code: "PF",
        types: {},
    },
    "TF": {
        id: 82,
        title: "French Southern Territories",
        code: "TF",
        types: {},
    },
    "GA": {
        id: 83,
        title: "Gabon",
        code: "GA",
        types: {},
    },
    "GM": {
        id: 84,
        title: "Gambia The",
        code: "GM",
        types: {},
    },
    "GE": {
        id: 85,
        title: "Georgia",
        code: "GE",
        types: {},
    },
    "DE": {
        id: 86,
        title: "Germany",
        code: "DE",
        types: {},
    },
    "GH": {
        id: 87,
        title: "Ghana",
        code: "GH",
        types: {},
    },
    "GI": {
        id: 88,
        title: "Gibraltar",
        code: "GI",
        types: {},
    },
    "GR": {
        id: 89,
        title: "Greece",
        code: "GR",
        types: {},
    },
    "GL": {
        id: 90,
        title: "Greenland",
        code: "GL",
        types: {},
    },
    "GD": {
        id: 91,
        title: "Grenada",
        code: "GD",
        types: {},
    },
    "GP": {
        id: 92,
        title: "Guadeloupe",
        code: "GP",
        types: {},
    },
    "GU": {
        id: 93,
        title: "Guam",
        code: "GU",
        types: {},
    },
    "GT": {
        id: 94,
        title: "Guatemala",
        code: "GT",
        types: {},
    },
    "GG": {
        id: 95,
        title: "Guernsey and Alderney",
        code: "GG",
        types: {},
    },
    "GN": {
        id: 96,
        title: "Guinea",
        code: "GN",
        types: {},
    },
    "GW": {
        id: 97,
        title: "Guinea-Bissau",
        code: "GW",
        types: {},
    },
    "GY": {
        id: 98,
        title: "Guyana",
        code: "GY",
        types: {},
    },
    "HT": {
        id: 99,
        title: "Haiti",
        code: "HT",
        types: {},
    },
    "HM": {
        id: 100,
        title: "Heard Island and McDonald Islands",
        code: "HM",
        types: {},
    },
    "HN": {
        id: 101,
        title: "Honduras",
        code: "HN",
        types: {},
    },
    "HK": {
        id: 102,
        title: "Hong Kong S.A.R.",
        code: "HK",
        types: {},
    },
    "HU": {
        id: 103,
        title: "Hungary",
        code: "HU",
        types: {},
    },
    "IS": {
        id: 104,
        title: "Iceland",
        code: "IS",
        types: {},
    },
    "IR": {
        id: 105,
        title: "Iran",
        code: "IR",
        types: {},
    },
    "IQ": {
        id: 106,
        title: "Iraq",
        code: "IQ",
        types: {},
    },
    "IE": {
        id: 107,
        title: "Ireland",
        code: "IE",
        types: {},
    },
    "IL": {
        id: 108,
        title: "Israel",
        code: "IL",
        types: {},
    },
    "IT": {
        id: 109,
        title: "Italy",
        code: "IT",
        types: {},
    },
    "JM": {
        id: 110,
        title: "Jamaica",
        code: "JM",
        types: {},
    },
    "JP": {
        id: 111,
        title: "Japan",
        code: "JP",
        types: {},
    },
    "JE": {
        id: 112,
        title: "Jersey",
        code: "JE",
        types: {},
    },
    "JO": {
        id: 113,
        title: "Jordan",
        code: "JO",
        types: {},
    },
    "KZ": {
        id: 114,
        title: "Kazakhstan",
        code: "KZ",
        types: {},
    },
    "KE": {
        id: 115,
        title: "Kenya",
        code: "KE",
        types: {},
    },
    "KI": {
        id: 116,
        title: "Kiribati",
        code: "KI",
        types: {},
    },
    "KP": {
        id: 117,
        title: "North Korea",
        code: "KP",
        types: {},
    },
    "KR": {
        id: 118,
        title: "South Korea",
        code: "KR",
        types: {},
    },
    "KW": {
        id: 119,
        title: "Kuwait",
        code: "KW",
        types: {},
    },
    "KG": {
        id: 120,
        title: "Kyrgyzstan",
        code: "KG",
        types: {},
    },
    "LA": {
        id: 121,
        title: "Laos",
        code: "LA",
        types: {},
    },
    "LV": {
        id: 122,
        title: "Latvia",
        code: "LV",
        types: {},
    },
    "LB": {
        id: 123,
        title: "Lebanon",
        code: "LB",
        types: {},
    },
    "LS": {
        id: 124,
        title: "Lesotho",
        code: "LS",
        types: {},
    },
    "LR": {
        id: 125,
        title: "Liberia",
        code: "LR",
        types: {},
    },
    "LY": {
        id: 126,
        title: "Libya",
        code: "LY",
        types: {},
    },
    "LI": {
        id: 127,
        title: "Liechtenstein",
        code: "LI",
        types: {},
    },
    "LT": {
        id: 128,
        title: "Lithuania",
        code: "LT",
        types: {},
    },
    "LU": {
        id: 129,
        title: "Luxembourg",
        code: "LU",
        types: {},
    },
    "MO": {
        id: 130,
        title: "Macau S.A.R.",
        code: "MO",
        types: {},
    },
    "MK": {
        id: 131,
        title: "Macedonia",
        code: "MK",
        types: {},
    },
    "MG": {
        id: 132,
        title: "Madagascar",
        code: "MG",
        types: {},
    },
    "MW": {
        id: 133,
        title: "Malawi",
        code: "MW",
        types: {},
    },
    "MY": {
        id: 134,
        title: "Malaysia",
        code: "MY",
        types: {},
    },
    "MV": {
        id: 135,
        title: "Maldives",
        code: "MV",
        types: {},
    },
    "ML": {
        id: 136,
        title: "Mali",
        code: "ML",
        types: {},
    },
    "MT": {
        id: 137,
        title: "Malta",
        code: "MT",
        types: {},
    },
    "IM": {
        id: 138,
        title: "Man (Isle of)",
        code: "IM",
        types: {},
    },
    "MH": {
        id: 139,
        title: "Marshall Islands",
        code: "MH",
        types: {},
    },
    "MQ": {
        id: 140,
        title: "Martinique",
        code: "MQ",
        types: {},
    },
    "MR": {
        id: 141,
        title: "Mauritania",
        code: "MR",
        types: {},
    },
    "MU": {
        id: 142,
        title: "Mauritius",
        code: "MU",
        types: {},
    },
    "YT": {
        id: 143,
        title: "Mayotte",
        code: "YT",
        types: {},
    },
    "MX": {
        id: 144,
        title: "Mexico",
        code: "MX",
        types: {},
    },
    "FM": {
        id: 145,
        title: "Micronesia",
        code: "FM",
        types: {},
    },
    "MD": {
        id: 146,
        title: "Moldova",
        code: "MD",
        types: {},
    },
    "MC": {
        id: 147,
        title: "Monaco",
        code: "MC",
        types: {},
    },
    "MN": {
        id: 148,
        title: "Mongolia",
        code: "MN",
        types: {},
    },
    "ME": {
        id: 149,
        title: "Montenegro",
        code: "ME",
        types: {},
    },
    "MS": {
        id: 150,
        title: "Montserrat",
        code: "MS",
        types: {},
    },
    "MA": {
        id: 151,
        title: "Morocco",
        code: "MA",
        types: {},
    },
    "MZ": {
        id: 152,
        title: "Mozambique",
        code: "MZ",
        types: {},
    },
    "MM": {
        id: 153,
        title: "Myanmar",
        code: "MM",
        types: {},
    },
    "NA": {
        id: 154,
        title: "Namibia",
        code: "NA",
        types: {},
    },
    "NR": {
        id: 155,
        title: "Nauru",
        code: "NR",
        types: {},
    },
    "NP": {
        id: 156,
        title: "Nepal",
        code: "NP",
        types: {},
    },
    "535": {
        id: 157,
        title: "Bonaire",
        code: "535",
        types: {},
    },
    "NL": {
        id: 158,
        title: "Netherlands",
        code: "NL",
        types: {},
    },
    "NC": {
        id: 159,
        title: "New Caledonia",
        code: "NC",
        types: {},
    },
    "NZ": {
        id: 160,
        title: "New Zealand",
        code: "NZ",
        types: {},
    },
    "NI": {
        id: 161,
        title: "Nicaragua",
        code: "NI",
        types: {},
    },
    "NE": {
        id: 162,
        title: "Niger",
        code: "NE",
        types: {},
    },
    "NG": {
        id: 163,
        title: "Nigeria",
        code: "NG",
        types: {},
    },
    "NU": {
        id: 164,
        title: "Niue",
        code: "NU",
        types: {},
    },
    "NF": {
        id: 165,
        title: "Norfolk Island",
        code: "NF",
        types: {},
    },
    "MP": {
        id: 166,
        title: "Northern Mariana Islands",
        code: "MP",
        types: {},
    },
    "NO": {
        id: 167,
        title: "Norway",
        code: "NO",
        types: {},
    },
    "OM": {
        id: 168,
        title: "Oman",
        code: "OM",
        types: {},
    },
    "PK": {
        id: 169,
        title: "Pakistan",
        code: "PK",
        types: {},
    },
    "PW": {
        id: 170,
        title: "Palau",
        code: "PW",
        types: {},
    },
    "PS": {
        id: 171,
        title: "Palestinian Territory Occupied",
        code: "PS",
        types: {},
    },
    "PA": {
        id: 172,
        title: "Panama",
        code: "PA",
        types: {},
    },
    "PG": {
        id: 173,
        title: "Papua new Guinea",
        code: "PG",
        types: {},
    },
    "PY": {
        id: 174,
        title: "Paraguay",
        code: "PY",
        types: {},
    },
    "PE": {
        id: 175,
        title: "Peru",
        code: "PE",
        types: {},
    },
    "PH": {
        id: 176,
        title: "Philippines",
        code: "PH",
        types: {},
    },
    "PN": {
        id: 177,
        title: "Pitcairn Island",
        code: "PN",
        types: {},
    },
    "PL": {
        id: 178,
        title: "Poland",
        code: "PL",
        types: {},
    },
    "PT": {
        id: 179,
        title: "Portugal",
        code: "PT",
        types: {},
    },
    "PR": {
        id: 180,
        title: "Puerto Rico",
        code: "PR",
        types: {},
    },
    "QA": {
        id: 181,
        title: "Qatar",
        code: "QA",
        types: {},
    },
    "RE": {
        id: 182,
        title: "Reunion",
        code: "RE",
        types: {},
    },
    "RO": {
        id: 183,
        title: "Romania",
        code: "RO",
        types: {},
    },
    "RU": {
        id: 184,
        title: "Russia",
        code: "RU",
        types: {},
    },
    "RW": {
        id: 185,
        title: "Rwanda",
        code: "RW",
        types: {},
    },
    "SH": {
        id: 186,
        title: "Saint Helena",
        code: "SH",
        types: {},
    },
    "KN": {
        id: 187,
        title: "Saint Kitts And Nevis",
        code: "KN",
        types: {},
    },
    "LC": {
        id: 188,
        title: "Saint Lucia",
        code: "LC",
        types: {},
    },
    "PM": {
        id: 189,
        title: "Saint Pierre and Miquelon",
        code: "PM",
        types: {},
    },
    "VC": {
        id: 190,
        title: "Saint Vincent And The Grenadines",
        code: "VC",
        types: {},
    },
    "BL": {
        id: 191,
        title: "Saint-Barthelemy",
        code: "BL",
        types: {},
    },
    "MF": {
        id: 192,
        title: "Saint-Martin (French part)",
        code: "MF",
        types: {},
    },
    "WS": {
        id: 193,
        title: "Samoa",
        code: "WS",
        types: {},
    },
    "SM": {
        id: 194,
        title: "San Marino",
        code: "SM",
        types: {},
    },
    "ST": {
        id: 195,
        title: "Sao Tome and Principe",
        code: "ST",
        types: {},
    },
    "SA": {
        id: 196,
        title: "Saudi Arabia",
        code: "SA",
        types: {},
    },
    "SN": {
        id: 197,
        title: "Senegal",
        code: "SN",
        types: {},
    },
    "RS": {
        id: 198,
        title: "Serbia",
        code: "RS",
        types: {},
    },
    "SC": {
        id: 199,
        title: "Seychelles",
        code: "SC",
        types: {},
    },
    "SL": {
        id: 200,
        title: "Sierra Leone",
        code: "SL",
        types: {},
    },
    "SG": {
        id: 201,
        title: "Singapore",
        code: "SG",
        types: {},
    },
    "SK": {
        id: 202,
        title: "Slovakia",
        code: "SK",
        types: {},
    },
    "SI": {
        id: 203,
        title: "Slovenia",
        code: "SI",
        types: {},
    },
    "SB": {
        id: 204,
        title: "Solomon Islands",
        code: "SB",
        types: {},
    },
    "SO": {
        id: 205,
        title: "Somalia",
        code: "SO",
        types: {},
    },
    "GS": {
        id: 206,
        title: "South Georgia",
        code: "GS",
        types: {},
    },
    "SS": {
        id: 207,
        title: "South Sudan",
        code: "SS",
        types: {},
    },
    "ES": {
        id: 208,
        title: "Spain",
        code: "ES",
        types: {},
    },
    "LK": {
        id: 209,
        title: "Sri Lanka",
        code: "LK",
        types: {},
    },
    "SD": {
        id: 210,
        title: "Sudan",
        code: "SD",
        types: {},
    },
    "SR": {
        id: 211,
        title: "Suriname",
        code: "SR",
        types: {},
    },
    "SJ": {
        id: 212,
        title: "Svalbard And Jan Mayen Islands",
        code: "SJ",
        types: {},
    },
    "SZ": {
        id: 213,
        title: "Swaziland",
        code: "SZ",
        types: {},
    },
    "SE": {
        id: 214,
        title: "Sweden",
        code: "SE",
        types: {},
    },
    "CH": {
        id: 215,
        title: "Switzerland",
        code: "CH",
        types: {},
    },
    "SY": {
        id: 216,
        title: "Syria",
        code: "SY",
        types: {},
    },
    "TW": {
        id: 217,
        title: "Taiwan",
        code: "TW",
        types: {},
    },
    "TJ": {
        id: 218,
        title: "Tajikistan",
        code: "TJ",
        types: {},
    },
    "TZ": {
        id: 219,
        title: "Tanzania",
        code: "TZ",
        types: {},
    },
    "TH": {
        id: 220,
        title: "Thailand",
        code: "TH",
        types: {},
    },
    "TG": {
        id: 221,
        title: "Togo",
        code: "TG",
        types: {},
    },
    "TK": {
        id: 222,
        title: "Tokelau",
        code: "TK",
        types: {},
    },
    "TO": {
        id: 223,
        title: "Tonga",
        code: "TO",
        types: {},
    },
    "TT": {
        id: 224,
        title: "Trinidad And Tobago",
        code: "TT",
        types: {},
    },
    "TN": {
        id: 225,
        title: "Tunisia",
        code: "TN",
        types: {},
    },
    "TR": {
        id: 226,
        title: "Turkey",
        code: "TR",
        types: {},
    },
    "TM": {
        id: 227,
        title: "Turkmenistan",
        code: "TM",
        types: {},
    },
    "TC": {
        id: 228,
        title: "Turks And Caicos Islands",
        code: "TC",
        types: {},
    },
    "TV": {
        id: 229,
        title: "Tuvalu",
        code: "TV",
        types: {},
    },
    "UG": {
        id: 230,
        title: "Uganda",
        code: "UG",
        types: {},
    },
    "UA": {
        id: 231,
        title: "Ukraine",
        code: "UA",
        types: {},
    },
    "AE": {
        id: 232,
        title: "United Arab Emirates",
        code: "AE",
        types: {},
    },
    "GB": {
        id: 233,
        title: "United Kingdom",
        code: "GB",
        types: {},
    },
    "UM": {
        id: 234,
        title: "United States Minor Outlying Islands",
        code: "UM",
        types: {},
    },
    "UY": {
        id: 235,
        title: "Uruguay",
        code: "UY",
        types: {},
    },
    "UZ": {
        id: 236,
        title: "Uzbekistan",
        code: "UZ",
        types: {},
    },
    "VU": {
        id: 237,
        title: "Vanuatu",
        code: "VU",
        types: {},
    },
    "VA": {
        id: 238,
        title: "Vatican City State (Holy See)",
        code: "VA",
        types: {},
    },
    "VE": {
        id: 239,
        title: "Venezuela",
        code: "VE",
        types: {},
    },
    "VN": {
        id: 240,
        title: "Vietnam",
        code: "VN",
        types: {},
    },
    "VG": {
        id: 241,
        title: "Virgin Islands (British)",
        code: "VG",
        types: {},
    },
    "VI": {
        id: 242,
        title: "Virgin Islands (US)",
        code: "VI",
        types: {},
    },
    "WF": {
        id: 243,
        title: "Wallis And Futuna Islands",
        code: "WF",
        types: {},
    },
    "EH": {
        id: 244,
        title: "Western Sahara",
        code: "EH",
        types: {},
    },
    "YE": {
        id: 245,
        title: "Yemen",
        code: "YE",
        types: {},
    },
    "ZM": {
        id: 246,
        title: "Zambia",
        code: "ZM",
        types: {},
    },
    "ZW": {
        id: 247,
        title: "Zimbabwe",
        code: "ZW",
        types: {},
    },
    "XK": {
        id: 248,
        title: "Kosovo",
        code: "XK",
        types: {},
    },
    "CW": {
        id: 249,
        title: "Curaçao",
        code: "CW",
        types: {},
    },
    "SX": {
        id: 250,
        title: "Sint Maarten (Dutch part)",
        code: "SX",
        types: {},
    },
}

function validateSouthAfricanId(idNumber: any, birthdate: any, gender: any) {

    if (!containsOnlyNumbers(idNumber)) {
        return false
    }

    if (idNumber.toString().length !== 13) {
        return false
    }
    let numbers = idNumber.toString().split("")

    // Validate the day and month - starts
    let id_year = `${numbers[0]}${numbers[1]}`;
    console.log(id_year);

    let id_month: any = `${numbers[2]}${numbers[3]}`;
    console.log(id_month);

    let id_day: any = `${numbers[4]}${numbers[5]}`;
    console.log(id_day);

    var date = `${id_year}${id_month}${id_day}`;

    let formatDate = birthdate.toString().replaceAll("-", "")
    var formatedBirthDate = formatDate.toString().slice(2, 8);

    if (formatedBirthDate != date) {
        return false
    }

    if (id_month < 1 || id_month > 12) {
        return false
    }

    if (id_day < 1 || id_day > 31) {
        return false
    }
    // Validate the day and month - ends


    // Validate gender - starts (Male : 1, Female - 2)
    var randomNumber: any = `${numbers[6]}${numbers[7]}${numbers[8]}${numbers[9]}`;

    if (gender == 1) {
        // Male
        if (randomNumber < 5000 || randomNumber > 9999) {
            return false;
        }
    } else {
        //Female
        if (randomNumber < 0 || randomNumber > 4999) {
            return false;
        }
    }
    // Validate gender - end

    //SA Citizen Number [08]
    var citizenNumber: any = `${numbers[10]}${numbers[11]}`;
    console.log("GetCitizenNumber: ",citizenNumber);
    
    if (citizenNumber != "08") {
        console.log("GetCitizenNumber: ","Its Non citizen");
        return false;
    }
    //SA Citizen Number [08]

    return true;
}

function containsOnlyNumbers(str:any) {
    return /^\d+$/.test(str);
  }

// function validateSouthAfricanIdOld(idNumber: any) {

//     if (idNumber.toString().length !== 13) {
//         return false
//     }
//     let numbers = idNumber.toString().split("")


//     // Validate the day and month - starts
//     let id_month = Number(`${numbers[2]}${numbers[3]}`);
//     let id_day = Number(`${numbers[4]}${numbers[5]}`);

//     if (id_month < 1 || id_month > 12) {
//         return false
//     }

//     if (id_day < 1 || id_day > 31) {
//         return false
//     }
//     // Validate the day and month - ends


//     // Validate gender - starts
//     /*let id_gender = numbers[6] >= 5 ? 'male' : 'female';

//     if (check for user gender field) {
//         return  false;
//     }*/
//     // Validate gender - ends

//     // Validate citizenship - starts
//     // citizenship as per id number
//     let id_foreigner = numbers[10];
//     /**
//      *  // if user is native then id_foreigner should be 0
//      *  // else 1
//      * */
//     // Validate citizenship - ends


//     /**********************************
//      Check Digit Verification
//      **********************************/

//     // Declare the arrays
//     let even_digits: any[] = [];
//     let odd_digits: any[] = [];

//     numbers.forEach((v: any) => {
//         if (Number(v) % 2 === 0) {
//             even_digits.push(Number(v))
//         } else {
//             odd_digits.push(Number(v))
//         }
//     })


//     // use array pop to remove the last digit from $odd_digits and store it in $check_digit
//     let check_digit = odd_digits.pop();

//     let added_odds = 0
//     odd_digits.forEach(value => {
//         added_odds += value
//     })

//     //All digits in even positions must be concatenated to form a 6 digits number.
//     let concatenated_evens = even_digits.join("")

//     //This 6 digits number must then be multiplied by 2.
//     let evensx2 = Number(concatenated_evens) * 2;

//     // Add all the numbers produced from the even numbers x 2
//     let evensx2Array = evensx2.toString().split("")

//     let added_evens = 0
//     evensx2Array.forEach(value => {
//         added_evens += Number(value)
//     })


//     let sum = added_odds + added_evens;

//     // get the last digit of the $sum
//     let last_digit = sum.toString().charAt(sum.toString().length - 1);

//     /* 10 - $last_digit
//      * $verify_check_digit = 10 - (int)$last_digit; (Will break if $last_digit = 0)
//      * Edit suggested by Ruan Luies
//      * verify check digit is the resulting remainder of
//      *  10 minus the last digit divided by 10
//      */
//     let verify_check_digit = Math.floor((10 - Number(last_digit)) % 10);

//     // test expected last digit against the last digit in $id_number submitted
//     return verify_check_digit === check_digit


// }

function validateAdharCard(idNumber: any) {
    return idNumber.toString().match(AppConstants.REGX_ADHAR_CARD) != null;
}

function validateSocialSecurityId(idNumber: any) {
    return idNumber.toString().match(AppConstants.REGX_SSN_ID) != null;
}

function validateChineseIdentityId(idNumber: any) {
    // TODO : CNID verification pending
    return false;
}

function validatePanCard(idNumber: any) {
    return idNumber.toString().match(AppConstants.REGX_PAN_CARD) != null;
}

export function verifyDocumentId(countryCode: string, documentType: number, idNumber: any, birthdate: any, gender: any): boolean {

    let type = documentType

    console.log(countryCode, " : ", type, " : ", idNumber)

    switch (countryCode) {
        case "ZA":
            switch (type) {
                case 1:
                    return validateSouthAfricanId(idNumber, birthdate, gender)
                default:
                    return validateSouthAfricanId(idNumber, birthdate, gender)
            }
        case "IN":
            switch (type) {
                case 1:
                    return validateAdharCard(idNumber)
                case 2:
                    return validatePanCard(idNumber)
                default:
                    return validateAdharCard(idNumber)
            }
        case "US":
            switch (type) {
                case 1:
                    return validateSocialSecurityId(idNumber)
                default:
                    return validateSocialSecurityId(idNumber)
            }
        case "CN":
            switch (type) {
                case 1:
                    return validateChineseIdentityId(idNumber)
                default:
                    return validateChineseIdentityId(idNumber)
            }
        default: {
            return true
        }
    }

    // return false
}