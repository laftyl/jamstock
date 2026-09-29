# 01 — Google Form Fields

Status: structured from the raw form dump you pasted (see "Raw form dump" at the bottom for the original). This is now organized by section, with each field's column header, response type, options, and any branching logic noted, so it maps cleanly onto the import/matching code. If anything below misreads your intent, correct it directly in this file.

## Field reference (by section)

### Section 1: Registration
| Column header | Type | Required | Options / Notes |
|---|---|---|---|
| First name | short text | ✔ | |
| Last name | short text | ✔ | |
| Email | short text | ✔ | |
| Are you 21 or older? | single choice | ✔ | "Yes (or will be by 1/1/2027)" / "No" → **No routes to Section 8 (disqualified)** |
| Have you joined our Discord server? | single choice | | Yes / No — informational only |

### Section 2: Musical Experience
| Column header | Type | Required | Options / Notes |
|---|---|---|---|
| How much music experience do you have? | single choice | ✔ | None / Beginner / Intermediate / Advanced — this is the **skill level** field |
| What is your primary instrument? (check all that apply) | checkbox | ✔ | Vocalist, Guitarist, Bassist, Percussionist, Keys, Brass, Strings, Winds, Electronic musician, Recording/Mixing engineer, Other (free text), "I don't play an instrument but want to participate" |
| What other instruments can you play? (check all that apply) | checkbox | | Same option list as above — these are **secondary** instruments/roles |
| What musical skills do you have? (check all that apply) | checkbox | | Songwriting, Sound design, Arrangement, Music theory, Other (free text) |
| What genres are you most comfortable playing? (check all that apply) | checkbox | | Hip-hop, R&B, Pop, Rock, Indie, Alternative, Electronic, Jazz, Funk, Soul, Country, Folk, Punk, Metal, Gospel, Classical, Experimental, "I'm cool with any genre" |
| Are you open to playing genres outside your normal style? | single choice | ✔ | Absolutely / Potentially / "I prefer to stay in my preferred style" |

### Section 3: Equipment and Instruments
| Column header | Type | Required | Options / Notes |
|---|---|---|---|
| What portable instruments (and supporting equipment) do you have access to? (check all that apply) | checkbox | ✔ | Microphone, Guitar, Bass, Percussion, Keys, Brass, Strings, Winds, Electronic music equipment (MIDI/laptop/synths/VSTs), Recording/Mixing engineer, Other (free text), "I don't play an instrument but want to participate", "I do not have access to a portable version of my instrument with supporting equipment" |
| What equipment are you willing to share with bandmates? (check all that apply) | checkbox | ✔ | "I have no equipment / not comfortable sharing", Microphone, Guitar, Bass, Percussion, Keys, Brass, Strings, Winds, MIDI Controllers, Mics, Cables, Amps, Other (free text) |

### Section 4: Mixing Engineers (branch point)
| Column header | Type | Required | Options / Notes |
|---|---|---|---|
| Do you have mixing skills AND want to mix for this event? | single choice | ✔ | Yes → Section 5 (producer questions) / No → Section 6 |

### Section 5: Mixing Engineer Teams (only shown if "Yes" above)
| Column header | Type | Required | Options / Notes |
|---|---|---|---|
| Performer + Producer, or Producer only? | single choice | ✔ | Determines if this person also needs an instrument role or is production-only |
| If short on producers, open to producing for additional teams? | single choice | ✔ | Absolutely! / "No, I'd rather focus on my team" — signals a producer who can be **shared across bands** |
| Understand production may just be rough phone recordings, not polished? | single choice | ✔ | Confirms expectations; not used for matching |

### Section 5 (Commitment and Logistics — form has two sections numbered "5")
| Column header | Type | Required | Options / Notes |
|---|---|---|---|
| Willing to be a humble listener and/or patient mentor? | single choice | ✔ | "I'm here to make a banger..." → **routes to Section 8 (disqualified)** / "I have experience to share" (**mentor**) / "I am new and will humbly learn" (**newbie**) |
| How open to showcasing work to an audience? | single choice | ✔ | Don't show / prefer pre-recorded / prefer live / open to either — informational; note may change later |
| Reliable transportation to required in-person portions? | single choice | ✔ | Yes / No → **routes to Section 8 (disqualified)** |
| What hours are you free during the 48-hour event? (check all that apply) | checkbox | ✔ | Friday evening, Saturday morning/afternoon/evening, Sunday morning/afternoon/evening — this is the **availability** field |
| Committed to being a reliable bandmate for the full 48 hours? | single choice | ✔ | Yes / "some limitations, few hours" / "cannot commit" → **routes to Section 8 (disqualified)** |

### Section 6: Event Checkout
| Column header | Type | Required | Options / Notes |
|---|---|---|---|
| Have you purchased your event ticket? | single choice | ✔ | Yes only listed |
| Anything else we should know about your hopes/expectations? | long text | | Free text, informational only |

### Section 8: Disqualification (not a real answer — reached via branching)
Anyone routed here (under 21, no transportation, can't commit, or "wrong answer" on mentorship) should **not** be imported into the matchable participant pool. Need to confirm exact handling — see open question in `04_open_questions.md`.

## Multi-select fields
Yes — these are checkbox fields where someone can select multiple values (Excel export will likely show them as one cell with comma or newline-separated values, needs parsing): primary instrument, other instruments, musical skills, genres comfortable, portable instruments/equipment access, equipment willing to share, availability hours.

## Known messiness to expect in the real export
- "Other" free-text answers (instruments, skills, equipment) will need to be matched against known categories via keyword/regex rather than assumed clean.
- Checkbox answers likely arrive as a single string per cell (e.g. `"Guitarist, Bassist"`) that needs splitting.
- Two form sections are both labeled "Section 5" — don't rely on section number alone to distinguish them, use the header/question text.

## Raw form dump (original, kept for reference)
The word (Header) marks a column header. `*` marks required. `/Response-type` = long form, short form, checkbox etc. `//8` means selecting that answer routes registrants to section 8 (or whichever section is numbered). `>>Description` is just a description of the field above, not itself a field.

SECTION 1: RVA JamStock Registration Form

Show up. Make a band. Write a song. Jam out!

* Indicates required question

(Header) First name * /shortform

(Header) Last name * /shortform

(Header) Email * z/shortform

(Header) Are you 21 or older? * /multiplechoice //8

Yes (or I will be by the date of the event on 1/1/2027)

No

(Header) Have you joined our Discord server? /multiplechoice

Important event updates will happen there. >>Description

Yes

No

SECTION 2: Your Musical Experience

(Header) Are you a professional musician? No experience (except playing the recorder with your nose in middle school)? All are welcome!

How much music experience do you have? * /multiplechoice

None - I can clap my hands and hum a catchy tune.

Beginner - I know the fundamentals of my instrument.

Intermediate - I can write some decent songs.

Advanced - I am very good at my primary instrument.

(Header) What is your primary instrument? (Check all that apply) * /checkbox

Vocalist

Guitarist

Bassist

Percssionist

Keys

Brass

Strings

Winds

Electronic musician

Recording / Mixing engineer

Other /shortform answer

I don't play an instrument but I want to participate!

(Header) What other instruments can you play? (Check all that apply) /checkbox

Vocalist

Guitarist

Bassist

Percssionist

Keys

Brass

Strings

Winds

Electronic musician

Recording / Mixing engineer

Other /shortform answer

(Header) What musical skills do you have? (Check all that apply) /checkbox

Songwriting

Sound design

Arrangement

Music theory

Other: /shortform answer

(Header) What genres are you most comfortable playing (Check all that apply) /checkbox

Hip-hop

R&B

Pop

Rock

Indie

Alternative

Electronic

Jazz

Funk

Soul

Country

Folk

Punk

Metal

Gospel

Classical

Experimental

I'm cool with any genre

(Header) Are you open to playing genres outside of your normal playing style? * /multiplechoice

We'll try our best to match you with musicians whose interests and styles complement yours. >>Description

Absolutely

Potentially

I prefer to stay in my prefered style.

SECTION 3: Equipment and Instruments

(Header) What portable instruments (and supporting equipment) do you have access to? (Check all that apply) * /checkbox

Portable ex. You play keys and have a keyboard since lugging a grand piano to a venue would be a colossal PITA. >>Description

Supporting equipment ex. You play electric guitar, do you have cables, amps, etc. in order to play it with others? >>Description

Microphone

Guitar

Bass

Percussion

Keys

Brass

Strings

Winds

Electronic music equipment (MIDI, laptop, synths, VSTs etc)

Recording / Mixing engineer

Other /shortform answer

I don't play an instrument but I want to participate!

I do not have available access to a portable version of my instrument with the necessary supporting equipment.

(Header) What equipment, if any, are you willing to share with your bandmates for the duration of the event? * /checkbox

Participants are responsible for their own equipment. The event organizers ARE NOT RESPONSIBLE for loss, damage, or theft of personal equipment.

I have no equipment / I do not feel comfortable sharing my equipment to others

Microphone

Guitar

Bass

Percussion

Keys

Brass

Strings

Winds

MIDI Controllers

Mics

Cables

Amps

Other /shortform answer

SECTION 4: Mixing Engineers

(Header) Do you have skills in mixing music AND do you want to mix music for this event? * /multiplechoice

Yes //5

No //6

SECTION 5: Mixing Engineer Teams

(Header) Would you like to be both a performer and producer, or focus primarily on production? * /multiplechoice

Performer + Producer

Producer only

(Header) If this event is short on producers, would you be open to producing for additional teams? * /multiplechoice

Absolutely!

No, I'd rather focus on my team

(Header) Finally, do you understand that many bands may not have access to recording equipment? They may send you stems that are recorded on their phone. Basically, we don't expect you to work magic and understand balancing faders may be all you can do.  Are you comfortable knowing that not every song sent your way is going to ready to have amazing production on it? * /multiplechoice

I understand this is not an event to be a perfectionist!

Knowing this, production probably isn't the right call for me.

SECTION 5: Commitment and Logistics

This is a community event with a music theme. For many, this might be the first exposure they have to music. Learning music is the greatest gift I gave to myself. Welcoming and patience with potential musicians could mean giving that gift to them as well.

(Header) Are you willing to be a humble listener and/or a patient mentor regardless if you are a veteran musician or have ZERO musical background? * /multiplechoice

I am not here to learn or mentor. I'm here to make a banger, become famous, and eat more caviar than Taylor Swift! (This is the wrong answer for this event) //8

I have experience that I would love to share with others!

I am new and will humbly learn from those that know more than me!

(Header) You and your team will decide whether you want to showcase your song live or via a pre-recorded performance. How open are you to showcasing your work to an audience? * /multiplechoice NOTE: We may need something that allows bands to tell me that they change their mind on this!

Don't show my music! This is just for me.

I prefer a pre-recorded showcase

I prefer playing live

I'm open to either

(Header) Do you have reliable transportation to meet your band and attend the required in-person portions of the event? Kickoff: (1/1/2027 at 6pm - 7pm) Showcase: (1/3/2027 at 6pm - 9pm) Venue: In Your Ear Studios (123 Broad Street) * /multiplechoice

Yes

No //8

(Header) What hours are you free during the 48-hour event? (Check all that apply) * /checkbox

Friday evening

Saturday morning

Saturday afternoon

Saturday evening

Sunday morning

Sunday afternoon

Sunday evening

(Header) Are you committed to being a reliable bandmate for the full 48 hours of this event? * /multiplechoice

Think of this like a science project: your teammates are depending on you to show up and contribute. Event organizers will work hard to balance teams, but unexpected drop-offs will negatively affect everyone else. To mitigate No-Shows we ask for a non-refundable $20 event fee on the next page. >>Description

Yes - my team is relying on me and I am committed.

I have some scheduling limitations that won't take up more than a few hours. I will let my team know.

I cannot commit to the event. //8

SECTION 6: Event Checkout

(Header) Have you purchased your event ticket? * /singlechoice

Yes

(Header) Anything else we should know about your hopes and expectations for the event? /longform

SECTION 7: Based on your answers, this event is not going to be a great fit for you /not an answer. Do not count this in the matching algorithm

Since the primary goal of this event is community that welcomes all levels of musicianship and requires commitment from everyone on your team, we feel like this is not a good fit. Feel free to register again if you change your mind.
