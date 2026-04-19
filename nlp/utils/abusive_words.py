"""
Abusive / profanity / slang word list — multilingual (Roman transliteration).
Covers: English, Hindi, Gujarati, Kathiyawadi, Marathi, Punjabi,
        Urdu, Bengali, Rajasthani, Tamil, Telugu (Roman script).
Used as fast keyword pre-check before running BERT.
"""

ABUSIVE_WORDS = [

    # ── English profanity & slang ────────────────────────────────────────────
    "fuck", "fucking", "fucker", "fucked", "fucks", "motherfucker",
    "mf", "af", "wtf", "stfu", "gtfo", "ffs",
    "shit", "shitty", "bullshit", "horseshit", "shithead",
    "bitch", "bitches", "bitching", "son of a bitch",
    "bastard", "bastards",
    "asshole", "assholes", "ass", "jackass", "smartass",
    "damn", "dammit", "crap", "bloody",
    "cunt", "cunts",
    "dick", "dicks", "cock", "cocks", "prick", "dickhead",
    "piss", "pissed", "pissing", "pissoff",
    "whore", "slut", "slutty", "hoe", "hoes",
    "idiot", "idiots", "moron", "morons", "imbecile", "dolt",
    "retard", "retarded",
    "stupid", "dumbass", "dumb", "dumbfuck", "dimwit",
    "loser", "losers", "scumbag", "scumbags", "lowlife",
    "trash", "garbage", "filth", "scum",
    "nigger", "nigga", "faggot", "fag", "homo",
    # English slang insults
    "twat", "knob", "bellend", "tosser", "wanker",
    "numskull", "halfwit", "airhead", "bonehead",
    "jerk", "jerkoff", "creep", "sleazebag", "sleaze",
    "psycho", "nutjob", "freak",
    # English fraud/threat slang
    "cheat", "cheater", "cheating",
    "liar", "lying", "lied",
    "thief", "thieves", "stole", "stealing",
    "fraud", "fraudulent", "fraudster",
    "scam", "scammer", "scammers",
    "conman", "con artist", "grifter",
    "extort", "blackmail", "racket",
    "kill", "murder", "threaten", "threat",
    "rape", "molest", "attack",

    # ── Hindi profanity & slang ──────────────────────────────────────────────
    # Core gaalis
    "madarchod", "maderchod", "madarjaat",
    "behenchod", "bhenchod", "bhen ke lode",
    "chutiya", "chutiye", "chut", "choot",
    "gaand", "gand", "gaandu", "gandu",
    "bhosdike", "bhosdiwale", "bhosdi",
    "lund", "lavda", "lavde", "lawda", "lauda", "laude",
    "randi", "rand", "randwa",
    "harami", "haramzada", "haramzadi", "haramkhor",
    "saala", "saali", "sala", "sali",
    "bakwas", "bakchod", "bakchodibaaz",
    "kutte", "kutta", "kutiya", "kuttiya",
    "suar", "suwar", "suarke",
    "kamina", "kamine", "kamini",
    "tere baap ka", "teri maa", "teri ma ki",
    "beti chod", "betichod",
    "nikamma", "nikamme", "nikammi",
    "ullu", "ullu ka pattha", "ullu ki dumb",
    # Hindi fraud/cheat slang
    "chor", "chorni",
    "dhoka", "dhokha", "dhokebaaz", "dhokhebaaz",
    "nakli", "jaali", "jali", "farzi", "farji",
    "thag", "thagi", "thagibaaz",
    "pakhandhi", "pakhand",
    "jutha", "jhoota", "jhutha",
    # Hindi insult slang
    "bewakoof", "bewkoof",
    "gadha", "gadhe", "gadhi",
    "duffer", "buddhu",
    "pagal", "pagle", "pagali",
    "ghatiya",
    "kameena", "kameeni",
    "neech", "neecha",
    "chuha", "chooha",
    "nalayak",
    "besharam", "besharma",
    "sharmaogay",
    "makkaar",                # cunning/deceitful
    "lalchi",                 # greedy
    "laalchi",

    # ── Gujarati profanity & slang ───────────────────────────────────────────
    "bhenchodi", "maderchodi",
    "chutaro", "chutari", "chuta",
    "randi", "randvo",
    "gaand", "gandu",
    "lavdo", "lavda", "lavdi",
    "salo", "sali", "salo taro",
    "harami",
    "kutar", "kutaro", "kutari",
    "dhokho", "dhokhebaaz",
    "nakli", "jaali",
    "baga", "bago", "bagi",   # idiot/stupid
    "gadho", "gadha", "gadhi",
    "ghelo", "gheli", "ghela", # crazy/fool
    "murkh",
    "besaram", "besharmo",
    "tara bap", "tari ma", "tara baap no",
    "bhad ma ja", "bhadma ja",
    "bakri",                  # goat (used as insult)
    "fattu",                  # coward
    "kanjoos",                # miser
    "maakhan",
    "tamakhu",
    "lugdo", "lugdi",         # village slang: useless person
    "dagli", "daglo",         # idiot in Gujarati slang
    "chhakko", "chhakki",     # slang for effeminate
    "nalayak",
    "gando", "gandi",         # crazy
    "khisiyanu", "khisiyela",
    "ranghilo", "ranghili",   # shameless person
    "vago", "vagi",           # slang for useless/waste
    "bodhu", "bodho",         # dumb/stupid (Gujarati)
    "jungali",                # uncivilized
    "thagbaz", "thagbazi",
    "khokhlo", "khokhli",     # hollow/fake
    "pakhandhi",

    # ── Kathiyawadi slang (Saurashtra dialect, Gujarat) ──────────────────────
    # Kathiyawadi is a bold dialect — many terms overlap Gujarati but with
    # distinct Saurashtra regional slang
    "bhenchod",               # same, very common in Kathiyawad
    "chutaro", "chutari",
    "lavdo", "lavda",
    "gando", "gandi",
    "gadho", "ghelo",
    "ranghilo",
    "taro baap",              # "your father" (used offensively)
    "tari ma",
    "dhedo", "dhedi",         # Kathiyawadi: worthless/lowborn insult
    "dhed",
    "bharwad no",             # community-based slur (Saurashtra)
    "koli no",                # used offensively in Kathiyawad context
    "chhed",                  # nuisance / pest
    "chhednaro",
    "fatakiyo", "fataki",     # slang: troublemaker, nuisance
    "tofani",                 # mischievous (used as mild insult)
    "gugalo", "gugali",       # Kathiyawadi: idiot/simpleton
    "kami",                   # Kathiyawadi: lowlife/mean person
    "vando", "vandi",         # Kathiyawadi: monkey (insult)
    "khataro",                # dangerous/corrupt
    "chor",                   # thief
    "lutera", "lootero",      # looter
    "dhingro", "dhingri",     # Kathiyawadi: bully/thug
    "bablo", "babli",         # used dismissively/offensively
    "jangali",
    "melo", "meli",           # Kathiyawadi: dirty/filthy (person)
    "gadhedo",                # Kathiyawadi: big idiot (donkey)
    "mavali",                 # Kathiyawadi: goon/thug
    "tapori",
    "nakammo", "nakami",      # Kathiyawadi: useless
    "thetha", "thetho",       # Kathiyawadi: village bumpkin / simpleton
    "nakli",
    "chhalo", "chhali",       # Kathiyawadi: trickster/fake
    "vadlo", "vadli",         # Kathiyawadi slang: blabbermouth / gossip
    "khokhlo",
    "muthiyo",                # tightfisted/miser
    "kanjoos",
    "besharmo",
    "vagdo", "vagdi",         # Kathiyawadi: stray/wanderer (derogatory)
    "ranghiyo", "ranghiyo", "pikino" , "pikini", "pikno", "pikni", "pika" , "piki" , "piko"# Kathiyawadi: shameless person

    # ── Marathi profanity & slang ────────────────────────────────────────────
    "aai zavli", "aai zav", "aai cha gho",
    "bhain chod", "bhaenchod",
    "gaandya", "gaandoo",
    "chutya", "chutyat", "chut",
    "randi",
    "nakali", "nakli",
    "fassavne", "fasavne",
    "thag", "thagi",
    "bhikar", "bhikari",
    "ullu",
    "gadva", "gadav",
    "harami",
    "kamina",
    "luchha",
    "paji",                   # vile/wicked
    "badvaa",                 # scoundrel (Marathi slang)
    "haramkhor",
    "saala",
    "kutra", "kutri",         # dog (derogatory)
    "dhongekhor", "dhongebaaz", # fake/hypocrite
    "lafdya",                 # troublemaker
    "randya",
    "ghatiya",
    "phokata",                # useless

    # ── Punjabi profanity & slang ────────────────────────────────────────────
    "madarchod",
    "behenchod",
    "teri bhen",
    "teri maa",
    "teri phudi", "phuddi",
    "haramdi", "haramzaada",
    "chuttar", "chut",
    "kukkar", "kukkad",
    "gandmara",
    "gandu",
    "lavde",
    "suar",
    "kutte",
    "nalayak",
    "pagal",
    "dhokhebaaz",
    "nakli", "jaali",
    "fattu",                  # coward
    "buddhu",
    "oye panche",             # Punjabi slang: idiot
    "tohda",                  # your (used offensively)
    "kammeena",               # Punjabi: mean/lowlife
    "luchha", "luchi",
    "paaji",                  # Punjabi: vile
    "darpok",                 # coward
    "gaddar",                 # traitor
    "jhooth", "jhoothha",
    "thag",
    "kapti",                  # Punjabi: deceitful

    # ── Urdu profanity & slang ───────────────────────────────────────────────
    "harami",
    "randi",
    "madarchod",
    "bhenchod",
    "kameena", "kameeni",
    "ghatiya",
    "dhokhebaaz",
    "nakli", "jaali",
    "lanat",
    "khabees",
    "zaalim",
    "badmaash",               # criminal/rogue
    "aawara",                 # vagabond (derogatory)
    "makkaar",
    "zaleel",                 # despicable
    "fasaadi",                # troublemaker
    "munafiq",                # hypocrite
    "gadhay",                 # donkey (idiot)
    "ullu",
    "bewaqoof",
    "pagal",
    "chor",
    "thag",
    "luchha",
    "lafanga",                # vagabond/hoodlum
    "haramkhor",
    "kamzarf",                # lowlife
    "besharam",
    "ahsan faramosh",         # ungrateful

    # ── Bengali profanity & slang ────────────────────────────────────────────
    "mago choda", "maa chuda", "maa er chele",
    "boner choda", "bhoner choda",
    "shala", "shali",
    "kuttar bachcha",
    "haramjada", "haramjadi",
    "rand", "randi",
    "gadha",
    "besharam",
    "nakol", "nakal",
    "thak", "thaki",
    "chor",
    "dhoka",
    "page", "pagla",          # crazy
    "ullu",
    "goru",                   # cow (derogatory in context)
    "shuer baccha",           # pig's child
    "bokachoda",              # Bengali: stupid idiot
    "noshto",                 # Bengali: corrupt/immoral
    "chhagol",                # goat (idiot)
    "khanki",                 # prostitute (Bengali)
    "banchot",                # Bengali equivalent of bhenchod
    "motherfucker",
    "magi",                   # Bengali slang for promiscuous woman (abusive)
    "kutta",

    # ── Rajasthani slang ────────────────────────────────────────────────────
    "bhenchod",
    "madarchod",
    "chutiya",
    "gaand",
    "randi",
    "harami",
    "suar ko",
    "dhed",                   # caste slur (Rajasthan)
    "maaro",                  # Rajasthani: beat/hit (threatening)
    "luchho", "luchi",
    "ghor paapi",             # sinner
    "nakli",
    "thag",
    "makkaar",
    "paglo", "pagla",
    "haramkhor",
    "badmaash",
    "darpok",
    "gadha",
    "bawla", "bawli",         # crazy (Rajasthani)
    "dhingra",                # bully

    # ── Tamil (Roman transliteration) ────────────────────────────────────────
    "punda", "pundai",        # Tamil: vagina (profanity)
    "sunni",                  # Tamil: penis (profanity)
    "otha", "ootha",          # Tamil: intercourse (profanity)
    "thevidiya",              # Tamil: prostitute
    "loosu", "loosupaiyan",   # crazy/idiot
    "naaye",                  # dog (derogatory)
    "panni",                  # pig
    "kena paiyan",            # idiot boy
    "thayoli",                # Tamil abusive: son of a whore
    "soothu",                 # Tamil: ass
    "thevdiya",               # Tamil: prostitute
    "poi", "poikaran",        # liar
    "etta",                   # Tamil abusive expletive
    "baadu",                  # Tamil: rascal
    "mokkai",                 # stupid/boring (Tamil slang)
    "vennai",                 # Tamil slang: coward/weakling

    # ── Telugu (Roman transliteration) ──────────────────────────────────────
    "dengu", "dengey",        # Telugu profanity
    "pooku", "puku",          # Telugu: vagina (profanity)
    "modda",                  # Telugu: penis (profanity)
    "lanja", "lanji",         # Telugu: prostitute
    "donga", "dongalu",       # Telugu: thief
    "pichi",                  # Telugu: crazy
    "nakka",                  # Telugu: fox (used as cunning insult)
    "kukka",                  # dog (derogatory)
    "pandi",                  # pig
    "gadida",                 # donkey (idiot)
    "erri", "erripuku",       # Telugu abusive expletive
    "bokka",                  # Telugu: stupid/hole (abusive)
    "nee amma",               # your mother (abusive context)
    "nee akka",               # your sister (abusive context)
    "thodu",                  # Telugu abusive

    # ── Common cross-language leet / abbreviations ───────────────────────────
    "mc", "bc", "mcbc", "dc",
    "fu**", "sh*t", "b*tch", "a**",
    "r*ndi", "k*tta", "ch*tiya",
    "mf", "sob",

]
