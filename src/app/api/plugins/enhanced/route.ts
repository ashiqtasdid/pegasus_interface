import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DatabaseService } from '@/lib/database';

/**
 * Enhanced Plugins API Route
 * Provides comprehensive plugin management using the new database structure
 */

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;
    const visibility = searchParams.get('visibility') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const sortBy = searchParams.get('sortBy') || undefined;
    const search = searchParams.get('search') || undefined;

    let plugins;

    if (search) {
      // Perform search query
      plugins = await DatabaseService.searchPlugins(search, {
        userId,
        category,
        limit
      });
    } else {
      // Get user's plugins with filters
      plugins = await DatabaseService.getUserPlugins(userId, {
        category,
        status,
        visibility,
        limit,
        sortBy
      });
    }

    // Log user activity
    await DatabaseService.logUserActivity({
      userId,
      type: 'plugin_downloaded',
      action: 'list_plugins',
      description: `Retrieved ${plugins.length} plugins`,
      metadata: {
        success: true,
        userAgent: request.headers.get('user-agent') || undefined
      }
    });

    return NextResponse.json({
      success: true,
      plugins,
      count: plugins.length,
      filters: { category, status, visibility, limit, sortBy, search }
    });

  } catch (error) {
    console.error('Failed to fetch plugins:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const pluginData = await request.json();

    // Validate required fields
    if (!pluginData.pluginName || !pluginData.displayName) {
      return NextResponse.json(
        { error: 'Plugin name and display name are required' },
        { status: 400 }
      );
    }

    // Create plugin with comprehensive metadata
    const plugin = {
      userId,
      pluginId: `${userId}_${pluginData.pluginName}_${Date.now()}`, // Unique plugin identifier
      pluginName: pluginData.pluginName,
      displayName: pluginData.displayName,
      description: pluginData.description || '',
      category: pluginData.category || 'utility',
      tags: pluginData.tags || [],
      metadata: {
        version: pluginData.version || '1.0.0',
        author: session.user.name || 'Unknown',
        license: pluginData.license || 'MIT',
        dependencies: pluginData.dependencies || [],
        permissions: pluginData.permissions || [],
        compatibility: pluginData.compatibility || [],
        fileSize: 0,
        entryPoint: pluginData.entryPoint || 'index.js'
      },
      files: pluginData.files || [],
      mainFile: pluginData.mainFile || 'index.js',
      status: 'pending' as const,
      analytics: {
        downloadCount: 0,
        uniqueDownloads: 0,
        viewCount: 0,
        installCount: 0,
        reviewCount: 0
      },
      versions: [],
      currentVersion: pluginData.version || '1.0.0',
      visibility: pluginData.visibility || 'private' as const,
      isTemplate: pluginData.isTemplate || false,
      isFeatured: false
    };

    const pluginId = await DatabaseService.saveUserPlugin(plugin);

    // Log activity
    await DatabaseService.logUserActivity({
      userId,
      type: 'plugin_created',
      action: 'create_plugin',
      description: `Created plugin: ${plugin.displayName}`,
      pluginId,
      metadata: {
        success: true,
        userAgent: request.headers.get('user-agent') || undefined
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Plugin created successfully',
      pluginId,
      plugin: { ...plugin, _id: pluginId }
    });

  } catch (error) {
    console.error('Failed to create plugin:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const pluginId = searchParams.get('pluginId');
    const updates = await request.json();

    if (!pluginId) {
      return NextResponse.json(
        { error: 'Plugin ID is required' },
        { status: 400 }
      );
    }

    // Verify plugin ownership
    const plugin = await DatabaseService.getPluginById(pluginId, userId);
    if (!plugin) {
      return NextResponse.json(
        { error: 'Plugin not found or access denied' },
        { status: 404 }
      );
    }

    await DatabaseService.updatePlugin(pluginId, userId, updates);

    // Log activity
    await DatabaseService.logUserActivity({
      userId,
      type: 'plugin_created',
      action: 'update_plugin',
      description: `Updated plugin: ${plugin.displayName}`,
      pluginId,
      metadata: {
        success: true,
        userAgent: request.headers.get('user-agent') || undefined
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Plugin updated successfully',
      pluginId
    });

  } catch (error) {
    console.error('Failed to update plugin:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const pluginId = searchParams.get('pluginId');

    if (!pluginId) {
      return NextResponse.json(
        { error: 'Plugin ID is required' },
        { status: 400 }
      );
    }

    // Verify plugin ownership
    const plugin = await DatabaseService.getPluginById(pluginId, userId);
    if (!plugin) {
      return NextResponse.json(
        { error: 'Plugin not found or access denied' },
        { status: 404 }
      );
    }

    // Soft delete by updating status
    await DatabaseService.updatePlugin(pluginId, userId, { 
      status: 'deprecated',
      visibility: 'private'
    });

    // Log activity
    await DatabaseService.logUserActivity({
      userId,
      type: 'plugin_created',
      action: 'delete_plugin',
      description: `Deleted plugin: ${plugin.displayName}`,
      pluginId,
      metadata: {
        success: true,
        userAgent: request.headers.get('user-agent') || undefined
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Plugin deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete plugin:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
