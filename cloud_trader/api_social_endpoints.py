# ===================================================================
# SOCIAL SENTIMENT & GAMIFICATION ENDPOINTS
# ===================================================================


@app.post("/api/vote")
async def submit_vote(request: Request) -> Dict[str, Any]:
    """Submit a daily market prediction vote."""
    try:
        from .user_service import get_user_service
        from .voting_service import get_voting_service

        # Get user ID from Firebase token (for now, accept from body)
        # TODO: Add Firebase Auth middleware
        body = await request.json()
        uid = body.get("uid")  # Temporary - should come from auth middleware
        symbol = body.get("symbol")
        prediction = body.get("prediction")
        confidence = body.get("confidence", 0.5)

        if not uid or not symbol or not prediction:
            return {"error": "Missing required fields: uid, symbol, prediction"}

        voting_service = get_voting_service()
        result = await voting_service.submit_vote(uid, symbol, prediction, confidence)

        return result
    except Exception as e:
        logger.error(f"Vote submission failed: {e}")
        return {"error": str(e)}


@app.get("/api/sentiment/{symbol}")
async def get_sentiment(symbol: str) -> Dict[str, Any]:
    """Get aggregated crowd sentiment for a symbol."""
    try:
        from .voting_service import get_voting_service

        voting_service = get_voting_service()
        sentiment = await voting_service.get_crowd_sentiment(symbol)

        return sentiment
    except Exception as e:
        logger.error(f"Failed to get sentiment for {symbol}: {e}")
        return {"error": str(e)}


@app.get("/api/user/stats")
async def get_user_stats(request: Request) -> Dict[str, Any]:
    """Get user's points, streak, rank, and prediction stats."""
    try:
        from .user_service import get_user_service

        # Get user ID from Firebase token (for now, accept from query param)
        # TODO: Add Firebase Auth middleware
        uid = request.query_params.get("uid")

        if not uid:
            return {"error": "Missing uid parameter"}

        user_service = get_user_service()
        stats = await user_service.get_user_stats(uid)

        return stats
    except Exception as e:
        logger.error(f"Failed to get user stats: {e}")
        return {"error": str(e)}


@app.post("/api/user/checkin")
async def daily_checkin(request: Request) -> Dict[str, Any]:
    """Record daily check-in and award points."""
    try:
        from .user_service import get_user_service

        # Get user ID from Firebase token (for now, accept from body)
        # TODO: Add Firebase Auth middleware
        body = await request.json()
        uid = body.get("uid")

        if not uid:
            return {"error": "Missing uid"}

        user_service = get_user_service()
        result = await user_service.record_daily_checkin(uid)

        return result
    except Exception as e:
        logger.error(f"Daily check-in failed: {e}")
        return {"error": str(e)}


@app.post("/api/admin/score-predictions")
async def score_predictions(request: Request) -> Dict[str, Any]:
    """Admin endpoint to manually trigger prediction scoring."""
    try:
        from .voting_service import get_voting_service

        voting_service = get_voting_service()
        result = await voting_service.score_predictions()

        return result
    except Exception as e:
        logger.error(f"Prediction scoring failed: {e}")
        return {"error": str(e)}
