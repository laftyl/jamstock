# 01 — Google Form Fields

## 1. Paste your Google Form's column headers exactly as they appear in the Excel export
(Copy the header row from the exported .xlsx/.csv file. If names are long/messy, that's fine — paste exactly as-is.)

```
(paste here)
```

## 2. Paste one or two sample rows of data (use fake/placeholder data if the real data is private)
```
(paste here)
```

## 3. For each field, tell me what it means / how to use it
Example format:
- `Full Name` → participant's name
- `What instrument(s) do you play?` → instrument(s), may be multiple selected (comma-separated?)
- `Skill level` → self-rated 1-5, or beginner/intermediate/advanced?
- `Email` → contact info, not used for matching

(fill in below)
-
-
-

## 4. Are any fields multi-select (checkboxes) where someone could pick more than one instrument or answer?
(yes/no, and which fields)

## 5. Is there anything messy about the real export I should expect (typos, "Guitar " vs "guitar", blank rows, duplicate submissions)?
(describe)

## 6. (Added by me) This is the google form with all answers as it stands. Please rewrite your current structure with this information in mind. The word (Header) marks that this would be a column header. * Mark it is required. /Response-type tells you if it's long form, short form, checkbox etc. Note that we may need to include REGEX for typed responses. //8 means selecting that answer routes registratees to section 8 or whatever section is numbered. >>Description means this is just a description of the above header/question.
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
