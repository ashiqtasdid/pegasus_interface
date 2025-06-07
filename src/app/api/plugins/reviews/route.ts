import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../../lib/database';
import { auth } from '../../../../lib/auth';

// GET /api/plugins/reviews - Get reviews for a plugin or by user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pluginId = searchParams.get('pluginId');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (pluginId) {
      // Get reviews for a specific plugin
      const reviews = await DatabaseService.getPluginReviews(pluginId, { limit });
      return NextResponse.json({ reviews });
    } else if (userId) {
      // Get reviews by a specific user
      const reviews = await DatabaseService.getUserReviews(userId);
      return NextResponse.json({ reviews });
    } else {
      return NextResponse.json(
        { error: 'Either pluginId or userId is required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error fetching plugin reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plugin reviews' },
      { status: 500 }
    );
  }
}

// POST /api/plugins/reviews - Create a new review
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await DatabaseService.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { pluginId, rating, title, comment } = await request.json();

    if (!pluginId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Valid pluginId and rating (1-5) are required' },
        { status: 400 }
      );
    }

    // Check if plugin exists
    const plugin = await DatabaseService.getPluginById(pluginId);
    if (!plugin) {
      return NextResponse.json({ error: 'Plugin not found' }, { status: 404 });
    }

    // Check if user already reviewed this plugin
    const existingReviews = await DatabaseService.getPluginReviews(pluginId, { limit: 1000 });
    const userReview = existingReviews.find(review => review.userId === user._id.toString());
    
    if (userReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this plugin' },
        { status: 409 }
      );
    }

    const reviewData = {
      pluginId,
      userId: user._id.toString(),
      authorId: plugin.userId || user._id.toString(),
      rating,
      title: title || '',
      content: comment || '',
      pros: [],
      cons: [],
      isVerified: false,
      isEdited: false,
      helpfulCount: 0,
      status: 'approved' as const,
      userEmail: user.email,
      userName: user.name || 'Anonymous'
    };

    const review = await DatabaseService.createPluginReview(reviewData);
    
    // Log activity
    await DatabaseService.logUserActivity(
      user._id.toString(),
      'plugin',
      'reviewed',
      pluginId,
      { rating, title: title || 'No title' }
    );

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error('Error creating plugin review:', error);
    return NextResponse.json(
      { error: 'Failed to create plugin review' },
      { status: 500 }
    );
  }
}

// PUT /api/plugins/reviews - Update an existing review
export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await DatabaseService.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { reviewId, rating, title, comment } = await request.json();

    if (!reviewId) {
      return NextResponse.json(
        { error: 'reviewId is required' },
        { status: 400 }
      );
    }

    // Get existing review to get pluginId
    const existingReview = await DatabaseService.getPluginReviewById(reviewId);
    
    if (!existingReview || existingReview.userId !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Review not found or unauthorized' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return NextResponse.json(
          { error: 'Rating must be between 1 and 5' },
          { status: 400 }
        );
      }
      updateData.rating = rating;
    }
    if (title !== undefined) updateData.title = title;
    if (comment !== undefined) updateData.content = comment;

    await DatabaseService.updatePluginReview(
      reviewId,
      user._id.toString(),
      updateData
    );

    // Get the updated review to return it
    const updatedReview = await DatabaseService.getPluginReviewById(reviewId);

    if (!updatedReview) {
      return NextResponse.json(
        { error: 'Review not found after update' },
        { status: 404 }
      );
    }

    // Log activity
    await DatabaseService.logUserActivity(
      user._id.toString(),
      'plugin',
      'review_updated',
      updatedReview.pluginId,
      { reviewId, updates: Object.keys(updateData) }
    );

    return NextResponse.json({ review: updatedReview });
  } catch (error) {
    console.error('Error updating plugin review:', error);
    return NextResponse.json(
      { error: 'Failed to update plugin review' },
      { status: 500 }
    );
  }
}

// DELETE /api/plugins/reviews - Delete a review
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await DatabaseService.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { reviewId } = await request.json();

    if (!reviewId) {
      return NextResponse.json(
        { error: 'reviewId is required' },
        { status: 400 }
      );
    }

    const success = await DatabaseService.deletePluginReview(reviewId, user._id.toString());

    if (!success) {
      return NextResponse.json(
        { error: 'Review not found or unauthorized' },
        { status: 404 }
      );
    }

    // Log activity
    await DatabaseService.logUserActivity(
      user._id.toString(),
      'plugin',
      'review_deleted',
      null,
      { reviewId }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting plugin review:', error);
    return NextResponse.json(
      { error: 'Failed to delete plugin review' },
      { status: 500 }
    );
  }
}
