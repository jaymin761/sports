const admin = require("firebase-admin")

admin.initializeApp({
	credential: admin.credential.cert({
		"type": "service_account",
		"project_id": "beem-341121",
		"private_key_id": "50b7fd3eb3132dcc1d4039e992e90ea3195d7a37",
		"private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDPz6xg2+cmNxsg\n2A0LydV0hgpXEU0UYmoXvbvCDjTkeoMbFU/ZWppAuVQZ6SfNbrwp9Z6zGoXUU8lJ\n9O95tRglOqGvpmxO2arEaYpGtbwiiFO3MNewaBrO0mP80OuQmxXUSk8XxXVRmL9N\n39Z3hqykBVJs+tfeU01uYgfOzd9AZ9BhVWuN3s5cbcQUocbIZOHRDnXplKJ4CGlC\n222kRMAg2GSz0tMJR9ZP52opqCQbP5uiYJQ8rPO+RyJFkDNnlGtGBhIY59HIEci8\ntx82V4NEKCvtBSHgduCCvtZy+YnVhHphet8rEuVIMJzNMCIEUuAiuyap5gyg3DkE\nKpW+iCxxAgMBAAECggEAFNP7MnAH4Fgok2ekExjlGHswwR4+S/s7J+r/zQjQe0/e\nIRJHQQEoMbGBgOFR+HCPUmNIRyoy3J+TLqLqd5fTdjPErc6vz01YpLvxPHoNg6aH\nQXaXP5qHiVAj7lxgJ8urae4StE65nfaBwgPbwnoQhpXz93FCvok52wTfRHZ02EcB\nKpb5k84yiyDvFJQQz6sDr3V5bOPVYM+eDx77daJjK6bjcpU6hxQl4ofse5VdiAy2\nZl96ryb7amQFkg1yCdRbdO0CayXbjh0711sLQfwGfciJYGbF2D7lslGuHaM3ExQP\nWMUFnnqgohB7FzB26U8vO8yHXI6h/cTeZ/CAfT6qoQKBgQDolFJz6bjslspqRN93\nXs8WP2ipi1iYnEBdv5sqTSZ23qJrTzcqJmTS4yyg4fwtpYsovFwetmSgeh8hmigo\nPasBTGMKTtR7VF7fj6as6NdUlib45TQukfz4VD21RqVxfvteTZrdRVfEvLn6jV4w\nmJep3VQ9l8x1U6J8GyW6gcRBSQKBgQDkvNn11mTjnE6iB5pYxsxJUbloHPFzlsw9\nXtkJnYzS37i1ToXAiA0gRyWS/TLT0LgJUJ2fzlu2TckGVl1hde81vTWKEqxSYVmz\ni2KyS/g+CvnOu8+xk4xJD/Qk4f4NTAbhn5n+wowjxaqecVWSzRCaJHB45ocCIgdH\nh0GtjOO56QKBgQDe4WSymAQTFd4cQKw15LFnjJRsBZF9jh9Qt9GmlBCMUYYsd9lR\nl0F/pxyZgHb992qIOxm8hOWhs+YpeWWKSq6Zq+4tbqXJGm1gqHT9tpTEBrCKTHvZ\nNSXLhE8ubOkW/q09DfmemlklvAYtyVO+Fj0hF20nKVVSCjfn3swlEz5ToQKBgBZ6\n/QztQkMgdJX2G1RITYGTN56k4ZITqwUJElmgk1uSQ0wGaJzQgkG+3FGC8wDgTYYU\n1zkChf73zB8EU+8lMRpd+yoTxb3e9Xrw4wVU9BPc7kpEKRhxwOLZX4xUbayO4UpB\nblgcdLt7TNZ/mwJvhwcvN6KaPYCXKZH9GBZfd24pAoGAM68e5N9at6vAndkmIM+C\nITvXFF5c6gecTmKy3RLJRX0AwnsJuFarAIpZQnYROu/9o06F7+SKWK2hTV85dhUV\nEEWA1MnYBDnx6dmKDl1IjREy4EdyGcISTfdNkotVf/zxk9uHk9nC/34/9Fj0opgb\ncfntnMReBGho5pgIkDAGrq0=\n-----END PRIVATE KEY-----\n",
		"client_email": "firebase-adminsdk-avavz@beem-341121.iam.gserviceaccount.com",
		"client_id": "115760949017525720907",
		"auth_uri": "https://accounts.google.com/o/oauth2/auth",
		"token_uri": "https://oauth2.googleapis.com/token",
		"auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
		"client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-avavz%40beem-341121.iam.gserviceaccount.com"
	})
})

const firebaseMessaging = admin.messaging()
export { firebaseMessaging }
