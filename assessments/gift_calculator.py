#assessments/gift_calculator.py

from typing import Dict, List, Tuple
import json

class GiftCalculator:
    # Define motivational gifts and their descriptions from Romans 12:6-8
    MOTIVATIONAL_GIFTS = {
        'PERCEPTION': {
            'name': 'Perception (Prophecy)',
            'description': 'The perceiver is one who easily notices or understands and declares the will of God /the will of authority in an organization.',
            'details': '''
                The perceiver meets spiritual needs of others; individuals or group of people and keeps the 
                church or organization centered on spiritual or Godly principles. Key characteristics include:
                • Easily and quickly sees what is good or bad and hates doing wrong
                • Has strong convictions about right and wrong
                • Can easily discern character in others
                • Encourages others to admit when they do wrong
                • Believes problems and difficulties bring about spiritual growth
                • Has few but close relationships with others
                • Believes the Bible contains truth for all areas of life
                • Lives boldly directed by spiritual rules
                • Speaks truth without seeking to please others
                • Has strong influence when speaking
                • Feels deeply about wrongdoing and sin
            '''
        },
        'SERVICE': {
            'name': 'Service',
            'description': 'The server renders practical service to others and keeps the work of ministry or an organization moving.',
            'details': '''
                The server conscientiously helps, assists, carries out instructions and gives of themselves to be of use 
                in a wide variety of ways. They receive joy in helping, assisting and carrying out instructions. 
                Key characteristics include:
                • Able to identify and quickly meet needs of others
                • Enjoys hands-on work
                • Keeps things neat and orderly
                • Easily remembers details and past events
                • Enjoys having people around, especially at home
                • Completes what they start
                • Finds it difficult to turn down requests for help
                • Puts others' needs before their own
                • Enjoys short-term tasks
                • Shows love through actions more than words
                • Does more than asked
            '''
        },
        'TEACHING': {
            'name': 'Teaching',
            'description': 'The teacher researches and teaches what they know; they ascertain the truth of things that happen.',
            'details': '''
                The teacher meets the mental needs of others and keeps them studying and learning. They may teach 
                through writing rather than in person. Key characteristics include:
                • Presents information in an orderly way
                • Verifies accuracy of information
                • Enjoys studying and research
                • Values proper use of words
                • Uses Biblical examples in teaching
                • Concerned about correct use of Scripture
                • Prioritizes truth and facts over feelings
                • Searches for truth before accepting
                • Focuses on helping others grow in faith
                • Believes teaching is foundation for strong Christian life
                • Solves problems through Biblical teaching
            '''
        },
        'EXHORTATION': {
            'name': 'Exhortation',
            'description': 'The exhorter is devoted to making people live life effectively by encouraging personal progress.',
            'details': '''
                While teachers aim for the head, exhorters aim for the heart. They meet psychological needs and 
                help apply spiritual truths. Key characteristics include:
                • Loves encouraging others to live fully
                • Values seeing response when teaching
                • Emphasizes practical application of truth
                • Prefers practical learning
                • Guides others in spiritual growth
                • Enjoys working with people
                • Encourages development of helping abilities
                • Learns through experience
                • Gives constructive advice
                • Communicates effectively
                • Accepts people without judgment
                • Maintains positive outlook
            '''
        },
        'GIVING': {
            'name': 'Giving',
            'description': 'The giver has an inner motivation and desire to share in love and concern for the needy.',
            'details': '''
                Givers share themselves, material goods and money to meet specific needs. They share traits with 
                servers and love God's Word. Key characteristics include:
                • Gives freely of money and resources
                • Prefers to give anonymously
                • Wants to be part of work they support
                • Prays for others' needs and salvation
                • Finds joy in meeting important needs
                • Values quality in giving
                • Gives as directed by inner prompting
                • Supports both individual and ministry needs
                • Views hospitality as giving opportunity
                • Manages money wisely
                • Quick to volunteer help
                • Prays about giving decisions
            '''
        },
        'ADMINISTRATION': {
            'name': 'Administration',
            'description': 'The administrator finds leadership work easy and is highly motivated to give direction.',
            'details': '''
                Administrators are facilitators, organizers, rulers and leaders who meet functional needs and raise 
                vision. Key characteristics include:
                • Loves organizing events and programs
                • Communicates effectively
                • Values learning under leadership
                • Takes leadership when called
                • Steps in when leadership is needed
                • Works well on long-term projects
                • Sees big picture clearly
                • Skilled at selecting and equipping people
                • Enjoys supervising others
                • Accepts constructive criticism
                • Finds joy in work
                • Aims for success in all endeavors
                • Shares credit with team members
            '''
        },
        'COMPASSION': {
            'name': 'Compassion',
            'description': 'The compassionate person cheerfully demonstrates mercy for those who are suffering physically or spiritually.',
            'details': '''
                They provide personal and emotional support while maintaining right attitudes and relationships. 
                Key characteristics include:
                • Shows consistent love
                • Sees and emphasizes good in others
                • Senses needs through atmosphere
                • Drawn to people with problems
                • Helps overcome difficulties
                • Cares for hidden hurts
                • Facilitates good relationships
                • Gives best opportunities to others
                • Avoids causing hurt
                • Discerns wrong motives
                • Drawn to other compassionate people
                • Does unexpected kind acts
                • Trustworthy and trusting
                • Avoids conflict
                • Takes time with tasks
            '''
        }
    }

    def __init__(self):
        self.gift_scores = {gift: 0.0 for gift in self.MOTIVATIONAL_GIFTS.keys()}
        self.total_questions = 0

    def calculate_scores(self, answers: List[Dict]) -> Dict[str, float]:
        """Calculate motivational gift scores based on assessment answers"""
        # Initialize scores
        raw_scores = {gift: 0.0 for gift in self.MOTIVATIONAL_GIFTS.keys()}
        max_possible_scores = {gift: 0.0 for gift in self.MOTIVATIONAL_GIFTS.keys()}
        
        # Calculate raw scores and maximum possible scores
        for answer in answers:
            score = answer['answer']  # Score is 1-5
            correlations = answer['gift_correlation']
            
            for gift, correlation in correlations.items():
                if gift in raw_scores:
                    raw_scores[gift] += score * correlation
                    # Track maximum possible score for each gift
                    max_possible_scores[gift] += 5 * correlation  # 5 is max answer value

        # Normalize scores relative to their individual maximum possible scores
        normalized_scores = {}
        for gift in raw_scores:
            if max_possible_scores[gift] > 0:
                normalized_scores[gift] = raw_scores[gift] / max_possible_scores[gift]
            else:
                normalized_scores[gift] = 0.0

        # Convert to percentages that sum to 1 (100%) with higher precision
        total = sum(normalized_scores.values())
        if total > 0:
            final_scores = {}
            running_total = 0
            
            # Sort gifts by score for consistent rounding
            sorted_gifts = sorted(normalized_scores.items(), key=lambda x: x[1], reverse=True)
            
            # Process all but the last gift
            for gift, score in sorted_gifts[:-1]:
                percentage = score / total
                # Increase precision to 4 decimal places
                rounded_score = round(percentage, 4)
                final_scores[gift] = rounded_score
                running_total += rounded_score
            
            # Last gift gets the remaining percentage to ensure sum is exactly 1
            last_gift = sorted_gifts[-1][0]
            final_scores[last_gift] = round(1 - running_total, 4)
            
            # Sort back to original order
            final_scores = dict(sorted(final_scores.items()))
        else:
            # Fallback to equal distribution if all scores are 0
            equal_share = round(1.0 / len(normalized_scores), 4)
            final_scores = {gift: equal_share for gift in normalized_scores}

        return final_scores

    def identify_gifts(self, scores: Dict[str, float], threshold_factor: float = 0.80) -> Tuple[str, List[str]]:
        """Identify primary and secondary gifts based on scores"""
        # Debug print to show the precise scores
        print("Debug - Gift scores with high precision:")
        for gift, score in sorted(scores.items(), key=lambda x: x[1], reverse=True):
            print(f"  {gift}: {score:.4f}")
            
        # Sort gifts by score
        sorted_gifts = sorted(
            scores.items(),
            key=lambda x: (x[1], x[0]),  # Sort by score first, then by gift name for consistent tie-breaking
            reverse=True
        )

        # Primary gift is the highest score
        primary_gift = sorted_gifts[0][0]
        highest_score = sorted_gifts[0][1]
        
        print(f"Debug - Primary gift selected: {primary_gift} with score {highest_score:.4f}")

        # Calculate threshold for secondary gifts
        threshold = highest_score * threshold_factor

        # Identify secondary gifts (above threshold)
        secondary_gifts = [
            gift for gift, score in sorted_gifts[1:3]  # Limit to next 2 highest scores
            if score >= threshold
        ]

        # Ensure we have at least one secondary gift but no more than 2
        if not secondary_gifts and len(sorted_gifts) > 1:
            secondary_gifts = [sorted_gifts[1][0]]
        elif len(secondary_gifts) > 2:
            secondary_gifts = secondary_gifts[:2]

        # Return the gift names without any parenthetical content
        return (
            self.MOTIVATIONAL_GIFTS[primary_gift]['name'].split('(')[0].strip(),
            [self.MOTIVATIONAL_GIFTS[gift]['name'].split('(')[0].strip() 
             for gift in secondary_gifts]
        )

    def get_gift_descriptions(self, primary_gift: str, secondary_gifts: List[str]) -> Dict:
        """Get detailed descriptions for primary and secondary gifts"""
        # Convert gift names to uppercase for consistent comparison
        primary_gift = primary_gift.upper()
        secondary_gifts = [gift.upper() for gift in secondary_gifts]
        
        # Find the key that matches the gift name (case-insensitive)
        primary_key = next(k for k, v in self.MOTIVATIONAL_GIFTS.items() 
                          if v['name'].upper().startswith(primary_gift))
        secondary_keys = [next(k for k, v in self.MOTIVATIONAL_GIFTS.items() 
                             if v['name'].upper().startswith(gift))
                         for gift in secondary_gifts]
        
        return {
            'primary': {
                'gift': self.MOTIVATIONAL_GIFTS[primary_key]['name'],
                'description': self.MOTIVATIONAL_GIFTS[primary_key]['description'],
                'details': self.MOTIVATIONAL_GIFTS[primary_key]['details']
            },
            'secondary': [
                {
                    'gift': self.MOTIVATIONAL_GIFTS[key]['name'],
                    'description': self.MOTIVATIONAL_GIFTS[key]['description'],
                    'details': self.MOTIVATIONAL_GIFTS[key]['details']
                }
                for key in secondary_keys
            ]
        }