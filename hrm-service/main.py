from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator
import torch
import redis
import json
import logging
import asyncio
import time
import uuid
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
import numpy as np
import os
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global variables
hrm_model = None
redis_client = None
model_lock = asyncio.Lock()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting HRM Reasoning Service")
    await initialize_services()
    yield
    # Shutdown
    logger.info("Shutting down HRM Reasoning Service")
    await cleanup_services()

app = FastAPI(
    title="HRM Reasoning Service",
    description="Hierarchical Reasoning Model service for Kanchen-Academy",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer(auto_error=False)

# Pydantic Models
class ReasoningRequest(BaseModel):
    user_id: str = Field(..., min_length=1, max_length=100)
    problem_type: str = Field(..., pattern="^(flashcard|quiz|assessment|adaptive_path)$")
    input_data: Dict[str, Any] = Field(..., min_items=1)
    context: Dict[str, Any] = Field(default_factory=dict)
    session_id: Optional[str] = None

    @validator('input_data')
    def validate_input_data(cls, v):
        required_fields = ['quality_score', 'response_time']
        for field in required_fields:
            if field not in v:
                raise ValueError(f"Missing required field: {field}")
        return v

class ReasoningResponse(BaseModel):
    reasoning_depth: float = Field(..., ge=0, le=1)
    pattern_recognition: float = Field(..., ge=0, le=1)
    cognitive_load: float = Field(..., ge=0, le=1)
    recommended_difficulty: float = Field(..., ge=0, le=1)
    learning_insights: Dict[str, Any]
    adaptive_factors: Dict[str, float]
    processing_time_ms: int = Field(..., ge=0)

class BatchReasoningRequest(BaseModel):
    requests: List[ReasoningRequest] = Field(..., min_items=1, max_items=50)

class BatchReasoningResponse(BaseModel):
    results: List[ReasoningResponse]
    total_processing_time_ms: int
    batch_size: int

class AdaptiveScheduleRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    flashcard_history: List[Dict[str, Any]] = Field(..., min_items=1)
    current_performance: Dict[str, Any]
    learning_goals: Dict[str, Any] = Field(default_factory=dict)

class AdaptiveScheduleResponse(BaseModel):
    next_review_intervals: List[Dict[str, Any]]
    difficulty_adjustments: List[Dict[str, Any]]
    learning_trajectory: Dict[str, Any]

class QuizGenerationRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    topic: str = Field(..., min_length=1)
    difficulty_level: float = Field(..., ge=0, le=1)
    question_count: int = Field(..., ge=1, le=20)
    question_types: List[str]
    content_source: Dict[str, Any]
    user_profile: Dict[str, Any]

class QuizGenerationResponse(BaseModel):
    questions: List[Dict[str, Any]]
    quiz_metadata: Dict[str, Any]

class HealthCheckResponse(BaseModel):
    status: str
    timestamp: str
    gpu_available: bool
    redis_connected: bool
    model_loaded: bool
    version: str
    uptime_seconds: int
    queue_size: int
    avg_response_time_ms: float

# Service Classes
class HRMModelService:
    def __init__(self):
        self.model = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model_loaded = False
        self.load_time = None
        
    async def load_model(self):
        """Load HRM model with error handling"""
        try:
            logger.info(f"Loading HRM model on {self.device}")
            
            # Import HRM model (this would be your actual HRM implementation)
            # For now, we'll create a mock model
            self.model = self.create_mock_hrm_model()
            
            # Move to device and set to eval mode
            self.model.to(self.device)
            self.model.eval()
            
            # Optimize for inference
            if self.device.type == 'cuda':
                self.model = self.model.half()  # FP16 for faster inference
                
            self.model_loaded = True
            self.load_time = datetime.now()
            
            logger.info("HRM model loaded successfully")
            
            # Warmup
            await self.warmup_model()
            
        except Exception as e:
            logger.error(f"Failed to load HRM model: {e}")
            raise RuntimeError(f"Model loading failed: {e}")
    
    def create_mock_hrm_model(self):
        """Create a mock HRM model for demonstration"""
        import torch.nn as nn
        
        class MockHRMModel(nn.Module):
            def __init__(self):
                super().__init__()
                self.high_level_planner = nn.Sequential(
                    nn.Linear(10, 64),
                    nn.ReLU(),
                    nn.Linear(64, 32),
                    nn.ReLU(),
                    nn.Linear(32, 16)
                )
                self.low_level_executor = nn.Sequential(
                    nn.Linear(16, 32),
                    nn.ReLU(),
                    nn.Linear(32, 8),
                    nn.ReLU(),
                    nn.Linear(8, 4)  # reasoning_depth, pattern_recognition, cognitive_load, difficulty
                )
                
            def forward(self, input_sequence, context):
                # High-level reasoning
                high_level_output = self.high_level_planner(input_sequence)
                
                # Low-level execution
                output = self.low_level_executor(high_level_output)
                
                # Apply sigmoid to get 0-1 range
                output = torch.sigmoid(output)
                
                return {
                    'reasoning_depth': output[0].item(),
                    'pattern_recognition': output[1].item(),
                    'cognitive_load': output[2].item(),
                    'recommended_difficulty': output[3].item()
                }
        
        return MockHRMModel()
    
    async def warmup_model(self):
        """Warm up the model with dummy data"""
        try:
            dummy_input = torch.randn(10).to(self.device)
            dummy_context = torch.randn(5).to(self.device)
            
            with torch.no_grad():
                _ = self.model(dummy_input, dummy_context)
                
            logger.info("Model warmup completed")
        except Exception as e:
            logger.warning(f"Model warmup failed: {e}")
    
    async def analyze_reasoning(self, request: ReasoningRequest) -> Dict[str, Any]:
        """Analyze reasoning pattern using HRM"""
        if not self.model_loaded:
            raise RuntimeError("Model not loaded")
        
        start_time = time.time()
        
        try:
            # Prepare input
            model_input = self.prepare_model_input(request)
            
            # Run inference
            async with model_lock:
                with torch.no_grad():
                    output = self.model(
                        model_input['sequence'],
                        model_input['context']
                    )
            
            # Process output
            processed_output = self.process_model_output(output, request)
            
            processing_time = int((time.time() - start_time) * 1000)
            processed_output['processing_time_ms'] = processing_time
            
            return processed_output
            
        except Exception as e:
            logger.error(f"Reasoning analysis failed: {e}")
            raise RuntimeError(f"Analysis failed: {e}")
    
    def prepare_model_input(self, request: ReasoningRequest) -> Dict[str, torch.Tensor]:
        """Convert request to model input format"""
        
        # Extract features from input_data
        features = []
        
        # Basic features
        features.append(request.input_data.get('quality_score', 0) / 5.0)  # Normalize to 0-1
        features.append(min(1.0, request.input_data.get('response_time', 30000) / 60000))  # Normalize to 1 minute
        features.append(request.input_data.get('confidence_level', 0.5))
        features.append(request.input_data.get('hints_used', 0) / 5.0)  # Assume max 5 hints
        features.append(1.0 if request.input_data.get('partial_correct', False) else 0.0)
        features.append(request.input_data.get('conceptual_understanding', 0.5))
        features.append(request.input_data.get('metacognitive_awareness', 0.5))
        
        # Context features
        context_data = request.context
        features.append(context_data.get('difficulty_level', 0.5))
        features.append(len(context_data.get('user_history', {}).get('previous_performance', [])) / 20.0)  # Normalize
        features.append(context_data.get('user_history', {}).get('success_rate', 0.5))
        
        # Pad or truncate to expected size
        while len(features) < 10:
            features.append(0.0)
        features = features[:10]
        
        sequence = torch.tensor(features, dtype=torch.float32, device=self.device)
        context = torch.tensor([0.5] * 5, dtype=torch.float32, device=self.device)  # Mock context
        
        return {
            'sequence': sequence,
            'context': context
        }
    
    def process_model_output(self, output: Dict[str, float], request: ReasoningRequest) -> Dict[str, Any]:
        """Process model output into educational insights"""
        
        # Extract core metrics
        reasoning_depth = output['reasoning_depth']
        pattern_recognition = output['pattern_recognition']
        cognitive_load = output['cognitive_load']
        recommended_difficulty = output['recommended_difficulty']
        
        # Generate learning insights
        learning_insights = self.generate_learning_insights(
            reasoning_depth, pattern_recognition, cognitive_load, request
        )
        
        # Calculate adaptive factors
        adaptive_factors = self.calculate_adaptive_factors(
            reasoning_depth, pattern_recognition, cognitive_load
        )
        
        return {
            'reasoning_depth': reasoning_depth,
            'pattern_recognition': pattern_recognition,
            'cognitive_load': cognitive_load,
            'recommended_difficulty': recommended_difficulty,
            'learning_insights': learning_insights,
            'adaptive_factors': adaptive_factors
        }
    
    def generate_learning_insights(self, depth: float, pattern: float, load: float, request: ReasoningRequest) -> Dict[str, Any]:
        """Generate educational insights"""
        insights = {
            'reasoning_strengths': [],
            'improvement_areas': [],
            'study_recommendations': [],
            'optimal_study_time': 30
        }
        
        # Analyze strengths
        if depth > 0.7:
            insights['reasoning_strengths'].append('Deep analytical thinking')
        if pattern > 0.7:
            insights['reasoning_strengths'].append('Strong pattern recognition')
        if load < 0.4:
            insights['reasoning_strengths'].append('Efficient cognitive processing')
        
        # Identify improvement areas
        if depth < 0.5:
            insights['improvement_areas'].append('Logical reasoning development')
            insights['study_recommendations'].append('Practice multi-step problems')
        if pattern < 0.5:
            insights['improvement_areas'].append('Pattern identification skills')
            insights['study_recommendations'].append('Study recurring question patterns')
        if load > 0.8:
            insights['improvement_areas'].append('Cognitive load management')
            insights['study_recommendations'].append('Break down complex problems')
        
        # Adjust study time based on cognitive load
        if load > 0.8:
            insights['optimal_study_time'] = 20  # Shorter sessions
        elif load < 0.3:
            insights['optimal_study_time'] = 45  # Longer sessions
        
        return insights
    
    def calculate_adaptive_factors(self, depth: float, pattern: float, load: float) -> Dict[str, float]:
        """Calculate adaptive factors for spaced repetition"""
        
        # Difficulty multiplier based on reasoning performance
        difficulty_multiplier = (depth + pattern) / 2
        
        # Interval adjustment based on cognitive efficiency
        interval_adjustment = 1.0 + (1 - load) * 0.5  # Lower load = longer intervals
        
        # Confidence factor
        confidence_factor = (depth + pattern) / 2
        
        # Retention prediction
        retention_prediction = min(1.0, (depth * 0.4 + pattern * 0.3 + (1 - load) * 0.3))
        
        return {
            'difficulty_multiplier': round(difficulty_multiplier, 3),
            'interval_adjustment': round(interval_adjustment, 3),
            'confidence_factor': round(confidence_factor, 3),
            'retention_prediction': round(retention_prediction, 3)
        }

# Global service instances
hrm_service = HRMModelService()
request_metrics = {
    'total_requests': 0,
    'total_response_time': 0,
    'start_time': datetime.now()
}

# Dependency functions
async def get_auth_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # In production, validate JWT token here
    # For demo, we'll skip authentication
    return {"user_id": "demo_user"}

# Startup and shutdown
async def initialize_services():
    global redis_client
    
    try:
        # Initialize Redis
        redis_client = redis.Redis(
            host=os.getenv('REDIS_HOST', 'localhost'),
            port=int(os.getenv('REDIS_PORT', 6379)),
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5
        )
        redis_client.ping()
        logger.info("Redis connection established")
    except Exception as e:
        logger.error(f"Redis connection failed: {e}")
        redis_client = None
    
    # Load HRM model
    try:
        await hrm_service.load_model()
    except Exception as e:
        logger.error(f"Failed to initialize HRM service: {e}")
        raise

async def cleanup_services():
    global redis_client
    if redis_client:
        redis_client.close()

# API Endpoints
@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint"""
    uptime = (datetime.now() - request_metrics['start_time']).total_seconds()
    avg_response_time = (
        request_metrics['total_response_time'] / max(1, request_metrics['total_requests'])
    )
    
    return HealthCheckResponse(
        status="healthy" if hrm_service.model_loaded else "degraded",
        timestamp=datetime.now().isoformat(),
        gpu_available=torch.cuda.is_available(),
        redis_connected=redis_client is not None and redis_client.ping(),
        model_loaded=hrm_service.model_loaded,
        version="1.0.0",
        uptime_seconds=int(uptime),
        queue_size=0,  # Would track actual queue size in production
        avg_response_time_ms=avg_response_time
    )

@app.post("/analyze-reasoning", response_model=ReasoningResponse)
async def analyze_reasoning(
    request: ReasoningRequest,
    user: dict = Depends(get_auth_user)
):
    """Analyze reasoning pattern using HRM"""
    start_time = time.time()
    
    try:
        # Check cache first
        cache_key = f"reasoning:{request.user_id}:{hash(str(request.input_data))}"
        if redis_client:
            cached_result = redis_client.get(cache_key)
            if cached_result:
                logger.info(f"Cache hit for user {request.user_id}")
                return ReasoningResponse(**json.loads(cached_result))
        
        # Analyze with HRM
        result = await hrm_service.analyze_reasoning(request)
        
        # Update metrics
        request_metrics['total_requests'] += 1
        request_metrics['total_response_time'] += (time.time() - start_time) * 1000
        
        # Cache result
        if redis_client:
            redis_client.setex(cache_key, 3600, json.dumps(result))  # 1 hour cache
        
        return ReasoningResponse(**result)
        
    except Exception as e:
        logger.error(f"Reasoning analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/batch-analyze-reasoning", response_model=BatchReasoningResponse)
async def batch_analyze_reasoning(
    request: BatchReasoningRequest,
    user: dict = Depends(get_auth_user)
):
    """Batch analyze multiple reasoning patterns"""
    start_time = time.time()
    
    try:
        results = []
        for reasoning_request in request.requests:
            result = await hrm_service.analyze_reasoning(reasoning_request)
            results.append(ReasoningResponse(**result))
        
        total_time = int((time.time() - start_time) * 1000)
        
        return BatchReasoningResponse(
            results=results,
            total_processing_time_ms=total_time,
            batch_size=len(request.requests)
        )
        
    except Exception as e:
        logger.error(f"Batch analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/optimize-schedule", response_model=AdaptiveScheduleResponse)
async def optimize_schedule(
    request: AdaptiveScheduleRequest,
    user: dict = Depends(get_auth_user)
):
    """Generate optimized review schedule"""
    try:
        # This would implement the full adaptive scheduling logic
        # For demo, return a simplified response
        
        intervals = []
        adjustments = []
        
        for i, card_history in enumerate(request.flashcard_history):
            intervals.append({
                'flashcard_id': card_history.get('flashcard_id', f'card_{i}'),
                'recommended_interval_days': max(1, int(card_history.get('success_rate', 0.5) * 7)),
                'priority_score': (1 - card_history.get('success_rate', 0.5)) * 100,
                'reasoning_based_adjustment': card_history.get('reasoning_depth_history', [0.5])[-1]
            })
            
            adjustments.append({
                'flashcard_id': card_history.get('flashcard_id', f'card_{i}'),
                'current_difficulty': card_history.get('current_difficulty', 0.5),
                'recommended_difficulty': min(1.0, card_history.get('current_difficulty', 0.5) + 0.1),
                'adjustment_reason': 'Performance-based adjustment'
            })
        
        return AdaptiveScheduleResponse(
            next_review_intervals=intervals,
            difficulty_adjustments=adjustments,
            learning_trajectory={
                'predicted_mastery_timeline': '2-3 weeks',
                'focus_areas': ['Pattern recognition', 'Logical reasoning'],
                'estimated_study_time': 45,
                'success_probability': 0.85
            }
        )
        
    except Exception as e:
        logger.error(f"Schedule optimization failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-quiz", response_model=QuizGenerationResponse)
async def generate_quiz(
    request: QuizGenerationRequest,
    user: dict = Depends(get_auth_user)
):
    """Generate adaptive quiz questions"""
    try:
        # Mock quiz generation
        questions = []
        
        for i in range(request.question_count):
            questions.append({
                'id': str(uuid.uuid4()),
                'type': request.question_types[i % len(request.question_types)],
                'question_text': f"Sample question {i+1} about {request.topic}",
                'options': ['Option A', 'Option B', 'Option C', 'Option D'] if 'mcq' in request.question_types else None,
                'correct_answer': 'Option A' if 'mcq' in request.question_types else 'Sample answer',
                'explanation': f"This tests understanding of {request.topic}",
                'difficulty_level': request.difficulty_level,
                'cognitive_load': min(1.0, request.difficulty_level + 0.2),
                'reasoning_steps_required': ['Analyze', 'Apply concept', 'Evaluate'],
                'time_estimate': 120,  # 2 minutes
                'learning_objective': f"Master {request.topic} concepts"
            })
        
        return QuizGenerationResponse(
            questions=questions,
            quiz_metadata={
                'total_estimated_time': len(questions) * 120,
                'difficulty_distribution': {'easy': 30, 'medium': 60, 'hard': 10},
                'cognitive_load_profile': 'moderate',
                'adaptive_recommendations': ['Focus on reasoning steps', 'Take breaks between sections']
            }
        )
        
    except Exception as e:
        logger.error(f"Quiz generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/warmup")
async def warmup_model():
    """Warm up the HRM model"""
    try:
        start_time = time.time()
        await hrm_service.warmup_model()
        warmup_time = int((time.time() - start_time) * 1000)
        
        return {
            'success': True,
            'warmup_time_ms': warmup_time,
            'model_loaded': hrm_service.model_loaded
        }
        
    except Exception as e:
        logger.error(f"Model warmup failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats")
async def get_service_stats():
    """Get service statistics"""
    uptime = (datetime.now() - request_metrics['start_time']).total_seconds()
    
    return {
        'model_info': {
            'loaded': hrm_service.model_loaded,
            'device': str(hrm_service.device),
            'load_time': hrm_service.load_time.isoformat() if hrm_service.load_time else None
        },
        'performance_metrics': {
            'total_requests': request_metrics['total_requests'],
            'avg_response_time_ms': (
                request_metrics['total_response_time'] / max(1, request_metrics['total_requests'])
            ),
            'uptime_seconds': int(uptime)
        },
        'queue_status': {
            'current_queue_size': 0,
            'max_queue_size': 100,
            'processing_rate': request_metrics['total_requests'] / max(1, uptime / 60)  # requests per minute
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)