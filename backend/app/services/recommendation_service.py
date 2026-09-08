from typing import List
from ..schemas.emotion import ContextMode, EngagementLevel, MoodCategory, RecommendationItem


class RecommendationService:
    """
    Personalized Emotion & Engagement Recommendation Engine.
    Generates actionable, context-aware suggestions for Education and Healthcare Support modes.
    """

    @staticmethod
    def generate_recommendations(
        final_emotion: str,
        mood_category: MoodCategory,
        engagement_level: EngagementLevel,
        context_mode: ContextMode,
        is_mixed_emotion: bool = False,
    ) -> List[RecommendationItem]:
        items: List[RecommendationItem] = []

        if context_mode == ContextMode.EDUCATION:
            # --- EDUCATION RECOMMENDATION MATRIX ---
            if final_emotion == "happy" and engagement_level == EngagementLevel.HIGH:
                items.append(
                    RecommendationItem(
                        title="Optimal Cognitive Flow State",
                        description="You appear highly engaged and positive. Maintain your current pace and tackle challenging problem sets or advanced concepts.",
                        category="Study Flow",
                        action_type="activity",
                    )
                )
                items.append(
                    RecommendationItem(
                        title="Knowledge Consolidation",
                        description="Try teaching the learned concept to a peer or writing a quick summary note to solidify memory retention.",
                        category="Retention",
                        action_type="resource",
                    )
                )

            elif final_emotion == "happy":
                items.append(
                    RecommendationItem(
                        title="Positive Learning Momentum",
                        description="Your positive state creates great conditions for creative problem solving. Keep up the active inquiry!",
                        category="Engagement",
                        action_type="activity",
                    )
                )

            elif final_emotion == "neutral" and engagement_level == EngagementLevel.MEDIUM:
                items.append(
                    RecommendationItem(
                        title="Interactive Quiz Checkpoint",
                        description="Try introducing an interactive quiz, flashcards, or a short hands-on exercise to elevate active engagement.",
                        category="Interactivity",
                        action_type="activity",
                    )
                )
                items.append(
                    RecommendationItem(
                        title="Active Recall Technique",
                        description="Pause and recall 3 key points from the last topic without looking at your study notes.",
                        category="Retention",
                        action_type="resource",
                    )
                )

            elif final_emotion in ["fear", "angry"] or "stress" in final_emotion:
                items.append(
                    RecommendationItem(
                        title="Cognitive De-escalation & Pacing",
                        description="Try breaking the current assignment or task into smaller, manageable micro-steps. Take 3 deep diaphragmatic breaths before resuming.",
                        category="Stress Management",
                        action_type="mindfulness",
                    )
                )
                items.append(
                    RecommendationItem(
                        title="Reach Out for Clarification",
                        description="If coursework is causing frustration, mark the confusing sections and consult your instructor, mentor, or study group.",
                        category="Academic Support",
                        action_type="resource",
                    )
                )

            elif final_emotion == "sad" or mood_category == MoodCategory.NEGATIVE:
                items.append(
                    RecommendationItem(
                        title="Restorative Study Break",
                        description="Consider stepping away for a 10-minute restorative walk or hydration break. High cognitive loads while fatigued decrease retention.",
                        category="Wellness",
                        action_type="activity",
                    )
                )
                items.append(
                    RecommendationItem(
                        title="Supportive Learning Resources",
                        description="Access visual summaries, diagrammatic cheat-sheets, or video explanations rather than dense technical readings.",
                        category="Adaptation",
                        action_type="resource",
                    )
                )

            elif engagement_level == EngagementLevel.LOW:
                items.append(
                    RecommendationItem(
                        title="Format Adaptation",
                        description="Consider changing the learning format: switch from reading to an interactive video, simulation, or collaborative whiteboard.",
                        category="Engagement",
                        action_type="activity",
                    )
                )
                items.append(
                    RecommendationItem(
                        title="Pomodoro Reset",
                        description="Reset your cognitive timer with a 5-minute physical stretch followed by a focused 20-minute study sprint.",
                        category="Pacing",
                        action_type="mindfulness",
                    )
                )

            else:
                items.append(
                    RecommendationItem(
                        title="Balanced Progression",
                        description="Continue through your learning roadmap systematically, alternating between reading, reflection, and practice exercises.",
                        category="General",
                        action_type="activity",
                    )
                )

        else:
            # --- HEALTHCARE SUPPORT MODE (Strictly Non-Diagnostic & Supportive) ---
            if final_emotion in ["fear", "angry"] or "stress" in final_emotion:
                items.append(
                    RecommendationItem(
                        title="4-7-8 Calming Breathing Exercise",
                        description="Inhale quietly through the nose for 4 seconds, hold your breath for 7 seconds, and exhale completely through the mouth for 8 seconds. Repeat 4 times.",
                        category="Physiological Regulation",
                        action_type="mindfulness",
                    )
                )
                items.append(
                    RecommendationItem(
                        title="Support Network Outreach",
                        description="Consider sharing how you feel with a trusted friend, counselor, or caregiver. You do not have to process elevated stress alone.",
                        category="Social Connection",
                        action_type="resource",
                    )
                )

            elif final_emotion == "sad" or mood_category == MoodCategory.NEGATIVE:
                items.append(
                    RecommendationItem(
                        title="Mindful Grounding & Self-Compassion",
                        description="Engage in a 5-4-3-2-1 sensory grounding exercise: notice 5 things you can see, 4 you can touch, 3 you hear, 2 you smell, and 1 you taste.",
                        category="Mindfulness",
                        action_type="mindfulness",
                    )
                )
                items.append(
                    RecommendationItem(
                        title="Rest & Emotional Replenishment",
                        description="Allow yourself a moment of rest without judgment. Hydrate, take a warm shower, or listen to soothing ambient music.",
                        category="Self-Care",
                        action_type="activity",
                    )
                )

            elif final_emotion == "happy":
                items.append(
                    RecommendationItem(
                        title="Emotional Flourishing",
                        description="You exhibit positive emotional equilibrium. Take a moment to savor what brought joy today and note it in a gratitude journal.",
                        category="Positive Psychology",
                        action_type="activity",
                    )
                )

            elif final_emotion == "neutral":
                items.append(
                    RecommendationItem(
                        title="Mindful Equilibrium Check-In",
                        description="Your emotional baseline appears stable and centered. Maintain routine hydration and balanced circadian sleep schedules.",
                        category="Baseline Wellness",
                        action_type="activity",
                    )
                )

            # Standard supportive healthcare advisory
            items.append(
                RecommendationItem(
                    title="Professional Consultation Advisory",
                    description="If emotional distress, persistent low mood, or anxiety continues over extended periods, reach out to a licensed healthcare practitioner or counselor.",
                    category="Professional Guidance",
                    action_type="alert",
                )
            )

        if is_mixed_emotion:
            items.insert(
                0,
                RecommendationItem(
                    title="Complex Multi-Signal Observation",
                    description="Different modalities revealed differing emotional cues (e.g. facial expression vs spoken/written tone). This often reflects nuanced feelings or emotional masking.",
                    category="Multimodal Insight",
                    action_type="resource",
                ),
            )

        return items
