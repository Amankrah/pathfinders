from django.core.management.base import BaseCommand
from assessments.models import Question

class Command(BaseCommand):
    help = 'Load initial motivational gift assessment questions'

    def handle(self, *args, **kwargs):
        questions = [
            # Gift A - Perception/Prophecy Questions (10 questions)
            {
                'category': 'Perception',
                'text': 'I easily and quickly see what is good or bad and I hate doing wrong.',
                'weight': 1.0,
                'gift_correlation': {'PERCEPTION': 1.0, 'TEACHING': 0.3, 'ADMINISTRATION': 0.2}
            },
            {
                'category': 'Perception',
                'text': 'I encourage others to admit when they do wrong.',
                'weight': 1.0,
                'gift_correlation': {'PERCEPTION': 1.0, 'EXHORTATION': 0.4}
            },
            {
                'category': 'Perception',
                'text': 'I relate closely with very few people.',
                'weight': 1.0,
                'gift_correlation': {'PERCEPTION': 1.0, 'EXHORTATION': 0.2}
            },
            {
                'category': 'Perception',
                'text': 'I believe the Bible contains the truth to be applied in all areas of our lives.',
                'weight': 1.0,
                'gift_correlation': {'PERCEPTION': 1.0, 'TEACHING': 0.6, 'EXHORTATION': 0.3}
            },
            {
                'category': 'Perception',
                'text': 'I talk about issues as they are and I do not speak to please anyone.',
                'weight': 1.0,
                'gift_correlation': {'PERCEPTION': 1.0, 'TEACHING': 0.3, 'ADMINISTRATION': 0.2}
            },
            {
                'category': 'Perception',
                'text': 'When I speak, I am able to influence people easily.',
                'weight': 1.0,
                'gift_correlation': {'PERCEPTION': 1.0, 'ADMINISTRATION': 0.6, 'TEACHING': 0.4}
            },
            {
                'category': 'Perception',
                'text': 'I feel very bad when people do wrong or commit sin and I have a strong desire to do what is right.',
                'weight': 1.0,
                'gift_correlation': {'PERCEPTION': 1.0, 'COMPASSION': 0.4, 'EXHORTATION': 0.3}
            },
            {
                'category': 'Perception',
                'text': 'I like to demonstrate when reporting what I see.',
                'weight': 1.0,
                'gift_correlation': {'PERCEPTION': 1.0, 'TEACHING': 0.5, 'ADMINISTRATION': 0.3}
            },
            {
                'category': 'Perception',
                'text': 'I stick closely to my strong opinions and beliefs.',
                'weight': 1.0,
                'gift_correlation': {'PERCEPTION': 1.0, 'TEACHING': 0.3, 'ADMINISTRATION': 0.2}
            },
            {
                'category': 'Perception',
                'text': "I desire very much to see God's will done in everything, no matter what.",
                'weight': 1.0,
                'gift_correlation': {'PERCEPTION': 1.0, 'EXHORTATION': 0.4, 'TEACHING': 0.3}
            },

            # Gift B - Service Questions (10 questions)
            {
                'category': 'Service',
                'text': 'I am able to identify and quickly meet the needs of others.',
                'weight': 1.0,
                'gift_correlation': {'SERVICE': 1.0, 'COMPASSION': 0.5, 'EXHORTATION': 0.3}
            },
            {
                'category': 'Service',
                'text': 'I enjoy work that involves the use of my hands and always keep things neat and in order.',
                'weight': 1.0,
                'gift_correlation': {'SERVICE': 1.0, 'ADMINISTRATION': 0.5, 'COMPASSION': 0.2}
            },
            {
                'category': 'Service',
                'text': 'I easily remember details and events in time past.',
                'weight': 1.0,
                'gift_correlation': {'SERVICE': 1.0, 'ADMINISTRATION': 0.6, 'TEACHING': 0.3}
            },
            {
                'category': 'Service',
                'text': 'When I start something I wish to complete it and I enjoy doing things myself than asking someone to do it.',
                'weight': 1.0,
                'gift_correlation': {'SERVICE': 1.0, 'ADMINISTRATION': 0.4, 'GIVING': 0.2}
            },
            {
                'category': 'Service',
                'text': 'I find it difficult to turn down the requests for help from others and I care for the needs of others first of all before my own needs.',
                'weight': 1.0,
                'gift_correlation': {'SERVICE': 1.0, 'COMPASSION': 0.6, 'EXHORTATION': 0.3}
            },
            {
                'category': 'Service',
                'text': 'I express my love for others through my actions than in my words.',
                'weight': 1.0,
                'gift_correlation': {'SERVICE': 1.0, 'COMPASSION': 0.5, 'EXHORTATION': 0.3}
            },
            {
                'category': 'Service',
                'text': 'I love to be praised and encouraged by others.',
                'weight': 1.0,
                'gift_correlation': {'SERVICE': 1.0, 'ADMINISTRATION': 0.3, 'TEACHING': 0.2}
            },
            {
                'category': 'Service',
                'text': "I am always active and I do more than I'm asked to do.",
                'weight': 1.0,
                'gift_correlation': {'SERVICE': 1.0, 'ADMINISTRATION': 0.4, 'GIVING': 0.3}
            },
            {
                'category': 'Service',
                'text': 'I am happiest when my actions become helpful to someone.',
                'weight': 1.0,
                'gift_correlation': {'SERVICE': 1.0, 'COMPASSION': 0.5, 'EXHORTATION': 0.3}
            },
            {
                'category': 'Service',
                'text': 'I want everything to be done in the right way.',
                'weight': 1.0,
                'gift_correlation': {'SERVICE': 1.0, 'ADMINISTRATION': 0.6, 'TEACHING': 0.3}
            },

            # Gift C - Teaching Questions (10 questions)
            {
                'category': 'Teaching',
                'text': 'I like to present information in an orderly way for easy understanding.',
                'weight': 1.0,
                'gift_correlation': {'TEACHING': 1.0, 'ADMINISTRATION': 0.4, 'EXHORTATION': 0.3}
            },
            {
                'category': 'Teaching',
                'text': 'I check to make sure that every information I get is true.',
                'weight': 1.0,
                'gift_correlation': {'TEACHING': 1.0, 'PERCEPTION': 0.4, 'ADMINISTRATION': 0.3}
            },
            {
                'category': 'Teaching',
                'text': 'I enjoy studying and researching to know more.',
                'weight': 1.0,
                'gift_correlation': {'TEACHING': 1.0, 'PERCEPTION': 0.3, 'ADMINISTRATION': 0.2}
            },
            {
                'category': 'Teaching',
                'text': 'I enjoy learning and knowing the meanings of words and I think words must be properly used.',
                'weight': 1.0,
                'gift_correlation': {'TEACHING': 1.0, 'PERCEPTION': 0.3, 'EXHORTATION': 0.2}
            },
            {
                'category': 'Teaching',
                'text': 'I like using examples from the Bible to explain my points.',
                'weight': 1.0,
                'gift_correlation': {'TEACHING': 1.0, 'EXHORTATION': 0.5, 'PERCEPTION': 0.3}
            },
            {
                'category': 'Teaching',
                'text': 'I want everything to be established on the truth and I base my beliefs and opinions on investigated facts.',
                'weight': 1.0,
                'gift_correlation': {'TEACHING': 1.0, 'PERCEPTION': 0.5, 'ADMINISTRATION': 0.2}
            },
            {
                'category': 'Teaching',
                'text': "I don't allow my personal feelings to influence how I judge things. I believe facts are more important than personal feelings.",
                'weight': 1.0,
                'gift_correlation': {'TEACHING': 1.0, 'PERCEPTION': 0.5, 'ADMINISTRATION': 0.3}
            },
            {
                'category': 'Teaching',
                'text': 'I prefer helping others to grow in their faith than converting unbelievers.',
                'weight': 1.0,
                'gift_correlation': {'TEACHING': 1.0, 'EXHORTATION': 0.6, 'SERVICE': 0.2}
            },
            {
                'category': 'Teaching',
                'text': 'I control my emotions and feelings and I follow principles I have set for myself.',
                'weight': 1.0,
                'gift_correlation': {'TEACHING': 1.0, 'ADMINISTRATION': 0.4, 'PERCEPTION': 0.3}
            },
            {
                'category': 'Teaching',
                'text': 'I believe truth has the power to change people.',
                'weight': 1.0,
                'gift_correlation': {'TEACHING': 1.0, 'EXHORTATION': 0.5, 'PERCEPTION': 0.4}
            },

            # Gift D - Exhortation Questions (10 questions)
            {
                'category': 'Exhortation',
                'text': 'I love to encourage others to live fully and happily.',
                'weight': 1.0,
                'gift_correlation': {'EXHORTATION': 1.0, 'COMPASSION': 0.5, 'TEACHING': 0.3}
            },
            {
                'category': 'Exhortation',
                'text': 'I enjoy practicing the truth rather than just studying it.',
                'weight': 1.0,
                'gift_correlation': {'EXHORTATION': 1.0, 'TEACHING': 0.4, 'SERVICE': 0.3}
            },
            {
                'category': 'Exhortation',
                'text': 'I prefer learning things that can be used in practical ways.',
                'weight': 1.0,
                'gift_correlation': {'EXHORTATION': 1.0, 'TEACHING': 0.5, 'SERVICE': 0.4}
            },
            {
                'category': 'Exhortation',
                'text': 'I love to work with people and I accept people without judging them.',
                'weight': 1.0,
                'gift_correlation': {'EXHORTATION': 1.0, 'COMPASSION': 0.6, 'SERVICE': 0.3}
            },
            {
                'category': 'Exhortation',
                'text': 'I encourage others to develop in their ability to help others.',
                'weight': 1.0,
                'gift_correlation': {'EXHORTATION': 1.0, 'ADMINISTRATION': 0.5, 'TEACHING': 0.4}
            },
            {
                'category': 'Exhortation',
                'text': 'I love to help others by giving them advice and I would stop giving advice to those who show no sign of change.',
                'weight': 1.0,
                'gift_correlation': {'EXHORTATION': 1.0, 'TEACHING': 0.4, 'ADMINISTRATION': 0.3}
            },
            {
                'category': 'Exhortation',
                'text': "I prefer to touch people's life through my actions and way of life rather than talking to them about the gospel.",
                'weight': 1.0,
                'gift_correlation': {'EXHORTATION': 1.0, 'SERVICE': 0.6, 'COMPASSION': 0.2}
            },
            {
                'category': 'Exhortation',
                'text': 'I am able to take decisions easily.',
                'weight': 1.0,
                'gift_correlation': {'EXHORTATION': 1.0, 'ADMINISTRATION': 0.6, 'PERCEPTION': 0.4}
            },
            {
                'category': 'Exhortation',
                'text': 'I want to settle issues or problems I face with others quickly.',
                'weight': 1.0,
                'gift_correlation': {'EXHORTATION': 1.0, 'ADMINISTRATION': 0.5, 'COMPASSION': 0.4}
            },
            {
                'category': 'Exhortation',
                'text': 'I need a close friend with whom I could share ideas and thoughts.',
                'weight': 1.0,
                'gift_correlation': {'EXHORTATION': 1.0, 'COMPASSION': 0.5, 'SERVICE': 0.3}
            },

            # Gift E - Giving Questions (10 questions)
            {
                'category': 'Giving',
                'text': 'I easily give out money and other things and I want gifts given out to be of high quality.',
                'weight': 1.0,
                'gift_correlation': {'GIVING': 1.0, 'SERVICE': 0.4, 'COMPASSION': 0.3}
            },
            {
                'category': 'Giving',
                'text': 'I love to give without letting others know about it.',
                'weight': 1.0,
                'gift_correlation': {'GIVING': 1.0, 'COMPASSION': 0.4, 'SERVICE': 0.3}
            },
            {
                'category': 'Giving',
                'text': "I am happy anytime I am able to meet an important need in a person's life.",
                'weight': 1.0,
                'gift_correlation': {'GIVING': 1.0, 'COMPASSION': 0.6, 'SERVICE': 0.4}
            },
            {
                'category': 'Giving',
                'text': "I don't give unless it is the direction of an inner push or the Holy Spirit.",
                'weight': 1.0,
                'gift_correlation': {'GIVING': 1.0, 'PERCEPTION': 0.4, 'EXHORTATION': 0.3}
            },
            {
                'category': 'Giving',
                'text': 'I have the ability to handle money wisely and economically.',
                'weight': 1.0,
                'gift_correlation': {'GIVING': 1.0, 'ADMINISTRATION': 0.5, 'SERVICE': 0.3}
            },
            {
                'category': 'Giving',
                'text': 'I give attention to sharing the word of God.',
                'weight': 1.0,
                'gift_correlation': {'GIVING': 1.0, 'EXHORTATION': 0.6, 'TEACHING': 0.5}
            },
            {
                'category': 'Giving',
                'text': 'I believe God is the one who provides my needs.',
                'weight': 1.0,
                'gift_correlation': {'GIVING': 1.0, 'PERCEPTION': 0.4, 'EXHORTATION': 0.3}
            },
            {
                'category': 'Giving',
                'text': 'I work hard because I want to be successful in what I do.',
                'weight': 1.0,
                'gift_correlation': {'GIVING': 1.0, 'ADMINISTRATION': 0.6, 'SERVICE': 0.4}
            },
            {
                'category': 'Giving',
                'text': 'I am good at making money with both natural and divine wisdom.',
                'weight': 1.0,
                'gift_correlation': {'GIVING': 1.0, 'ADMINISTRATION': 0.4, 'PERCEPTION': 0.3}
            },
            {
                'category': 'Giving',
                'text': "I am careful not to allow others to influence me to waste money on anything",
                'weight': 1.0,
                'gift_correlation': {'GIVING': 1.0, 'ADMINISTRATION': 0.5, 'PERCEPTION': 0.3}
            },

            # Gift F - Administration Questions (10 questions)
            {
                'category': 'Administration',
                'text': 'I love to organize events and programmes when it is my responsibility.',
                'weight': 1.0,
                'gift_correlation': {'ADMINISTRATION': 1.0, 'SERVICE': 0.6, 'GIVING': 0.3}
            },
            {
                'category': 'Administration',
                'text': 'I am able to talk well for people to understand.',
                'weight': 1.0,
                'gift_correlation': {'ADMINISTRATION': 1.0, 'TEACHING': 0.6, 'EXHORTATION': 0.4}
            },
            {
                'category': 'Administration',
                'text': "I love working under someone's leadership so that I could also learn to be a leader with authority.",
                'weight': 1.0,
                'gift_correlation': {'ADMINISTRATION': 1.0, 'SERVICE': 0.5, 'EXHORTATION': 0.3}
            },
            {
                'category': 'Administration',
                'text': 'I will not take up leadership unless I am called to do so.',
                'weight': 1.0,
                'gift_correlation': {'ADMINISTRATION': 1.0, 'PERCEPTION': 0.5, 'EXHORTATION': 0.4}
            },
            {
                'category': 'Administration',
                'text': 'I will only take up leadership responsibility when the organization does not have someone.',
                'weight': 1.0,
                'gift_correlation': {'ADMINISTRATION': 1.0, 'SERVICE': 0.6, 'GIVING': 0.4}
            },
            {
                'category': 'Administration',
                'text': 'I can easily see the picture of what needs to be done.',
                'weight': 1.0,
                'gift_correlation': {'ADMINISTRATION': 1.0, 'PERCEPTION': 0.5, 'TEACHING': 0.3}
            },
            {
                'category': 'Administration',
                'text': 'I accept negative comments people make concerning the things I do so far as it is right.',
                'weight': 1.0,
                'gift_correlation': {'ADMINISTRATION': 1.0, 'TEACHING': 0.4, 'COMPASSION': 0.3}
            },
            {
                'category': 'Administration',
                'text': 'I am happy when those who work with me get the praise for what we do.',
                'weight': 1.0,
                'gift_correlation': {'ADMINISTRATION': 1.0, 'SERVICE': 0.5, 'COMPASSION': 0.4}
            },
            {
                'category': 'Administration',
                'text': 'I enjoy working with people, supervising them and being around them.',
                'weight': 1.0,
                'gift_correlation': {'ADMINISTRATION': 1.0, 'EXHORTATION': 0.5, 'SERVICE': 0.4}
            },
            {
                'category': 'Administration',
                'text': 'When things are started, I will like to see them completed quickly.',
                'weight': 1.0,
                'gift_correlation': {'ADMINISTRATION': 1.0, 'SERVICE': 0.6, 'GIVING': 0.3}
            },

            # Gift G - Compassion Questions (10 questions)
            {
                'category': 'Compassion',
                'text': 'I always show love.',
                'weight': 1.0,
                'gift_correlation': {'COMPASSION': 1.0, 'EXHORTATION': 0.5, 'SERVICE': 0.4}
            },
            {
                'category': 'Compassion',
                'text': 'I always look for the good in people and make them feel good.',
                'weight': 1.0,
                'gift_correlation': {'COMPASSION': 1.0, 'EXHORTATION': 0.5, 'SERVICE': 0.3}
            },
            {
                'category': 'Compassion',
                'text': 'I am able to know what is happening to a person or a group of people from the atmosphere around them.',
                'weight': 1.0,
                'gift_correlation': {'COMPASSION': 1.0, 'PERCEPTION': 0.5, 'EXHORTATION': 0.4}
            },
            {
                'category': 'Compassion',
                'text': 'I enjoy getting close to people who have problems, pray for them and I help people overcome their problems.',
                'weight': 1.0,
                'gift_correlation': {'COMPASSION': 1.0, 'EXHORTATION': 0.6, 'SERVICE': 0.3}
            },
            {
                'category': 'Compassion',
                'text': 'I help people relate well with one another.',
                'weight': 1.0,
                'gift_correlation': {'COMPASSION': 1.0, 'EXHORTATION': 0.6, 'ADMINISTRATION': 0.3}
            },
            {
                'category': 'Compassion',
                'text': 'I am usually happy. I try to avoid words and actions which will hurt others.',
                'weight': 1.0,
                'gift_correlation': {'COMPASSION': 1.0, 'EXHORTATION': 0.4, 'SERVICE': 0.3}
            },
            {
                'category': 'Compassion',
                'text': 'I can easily tell it when person does something with a wrong motive.',
                'weight': 1.0,
                'gift_correlation': {'COMPASSION': 1.0, 'PERCEPTION': 0.6, 'EXHORTATION': 0.4}
            },
            {
                'category': 'Compassion',
                'text': 'I am attracted to people who are compassionate to others.',
                'weight': 1.0,
                'gift_correlation': {'COMPASSION': 1.0, 'SERVICE': 0.4, 'EXHORTATION': 0.3}
            },
            {
                'category': 'Compassion',
                'text': 'My heart moves me to act more than how I think.',
                'weight': 1.0,
                'gift_correlation': {'COMPASSION': 1.0, 'SERVICE': 0.5, 'PERCEPTION': 0.2}
            },
            {
                'category': 'Compassion',
                'text': 'I rejoice when things go well with people and I am sad when I see people hurting.',
                'weight': 1.0,
                'gift_correlation': {'COMPASSION': 1.0, 'EXHORTATION': 0.5, 'SERVICE': 0.3}
            }
        ]

        created_count = 0
        updated_count = 0

        for q in questions:
            obj, created = Question.objects.get_or_create(
                text=q['text'],
                defaults={
                    'category': q['category'],
                    'weight': q['weight'],
                    'gift_correlation': q['gift_correlation']
                }
            )
            if created:
                created_count += 1
            else:
                # Update existing question
                obj.category = q['category']
                obj.weight = q['weight']
                obj.gift_correlation = q['gift_correlation']
                obj.save()
                updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully loaded questions: {created_count} created, {updated_count} updated'
            )
        )