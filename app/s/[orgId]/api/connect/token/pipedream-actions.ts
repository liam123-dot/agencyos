'use server'

import { PipedreamClient } from "@pipedream/sdk";
import { authorizedToAccessClient } from "@/app/api/clients/clientMembers";

const pipedreamClient = new PipedreamClient({
  projectEnvironment: (process.env.NEXT_PUBLIC_PIPEDREAM_ENVIRONMENT as "development" | "production") || "development",
  clientId: process.env.PIPEDREAM_CLIENT_ID,
  clientSecret: process.env.PIPEDREAM_CLIENT_SECRET,
  projectId: process.env.PIPEDREAM_PROJECT_ID,
});

/**
 * Generate a Pipedream Connect token for a client
 * This token is used to initiate the account connection flow
 * The client ID is used as the external user ID for Pipedream
 */
export async function generateConnectToken(clientId?: string) {
  try {
    // Authenticate and get client information
    const { client, organization } = await authorizedToAccessClient(clientId);

    if (!client?.id) {
      return {
        success: false,
        error: "Client not found or unauthorized",
      };
    }

    // Check for required environment variables
    if (!process.env.PIPEDREAM_CLIENT_ID || !process.env.PIPEDREAM_CLIENT_SECRET || !process.env.PIPEDREAM_PROJECT_ID) {
      console.error("Missing Pipedream credentials:", {
        hasClientId: !!process.env.PIPEDREAM_CLIENT_ID,
        hasClientSecret: !!process.env.PIPEDREAM_CLIENT_SECRET,
        hasProjectId: !!process.env.PIPEDREAM_PROJECT_ID,
      })
      return {
        success: false,
        error: "Pipedream credentials not configured",
      };
    }

    console.log('client', client.id)
    console.log('organization', organization.domain)

    // Create a token for the specific client (using client ID as external user ID)
    const { token, expiresAt, connectLinkUrl } = await pipedreamClient.tokens.create({
      externalUserId: client.id,
      // Note: Not restricting allowedOrigins since the user will be redirected to Pipedream's hosted page
    });

    console.log("Token generated successfully:", {
      hasToken: token,
      clientId: client.id,
      expiresAt,
      connectLinkUrl,
    })

    return {
      success: true,
      token,
      expiresAt,
      connectLinkUrl,
      clientId: client.id,
    };
  } catch (error) {
    console.error("Error generating Connect token:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate Connect token",
    };
  }
}

/**
 * Search for apps using the Pipedream API
 * Returns up to 15 apps matching the search query
 */
export async function searchApps(query: string, clientId?: string) {
  try {
    // Authenticate the user
    const { client, organization } = await authorizedToAccessClient(clientId);

    if (!client?.id) {
      return {
        success: false,
        error: "Client not found or unauthorized",
        apps: [],
      };
    }

    // Check for required environment variables
    if (!process.env.PIPEDREAM_CLIENT_ID || !process.env.PIPEDREAM_CLIENT_SECRET || !process.env.PIPEDREAM_PROJECT_ID) {
      console.error("Missing Pipedream credentials");
      return {
        success: false,
        error: "Pipedream credentials not configured",
        apps: [],
      };
    }

    // Search for apps using the Pipedream API
    const results = await pipedreamClient.apps.list({
      q: query,
      limit: 15,
    });

    console.log('results', results)

    return {
      success: true,
      apps: results.data || [],
      total: results.data?.length || 0,
    };
  } catch (error) {
    console.error("Error searching apps:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to search apps",
      apps: [],
    };
  }
}

/**
 * Get existing connected accounts for a client
 * Returns all accounts connected by this client
 */
export async function getExistingConnections(clientId?: string) {
  try {
    const { client, organization } = await authorizedToAccessClient(clientId);

    if (!client?.id) {
      return {
        success: false,
        error: "Client not found or unauthorized",
        accounts: [],
      };
    }

    // Check for required environment variables
    if (!process.env.PIPEDREAM_CLIENT_ID || !process.env.PIPEDREAM_CLIENT_SECRET || !process.env.PIPEDREAM_PROJECT_ID) {
      console.error("Missing Pipedream credentials");
      return {
        success: false,
        error: "Pipedream credentials not configured",
        accounts: [],
      };
    }

    // List all accounts for this external user (client)
    const results = await pipedreamClient.accounts.list({
      externalUserId: client.id,
      includeCredentials: false, // We don't need to expose credentials
    });

    // Collect all accounts from the paginated results
    const accounts = [];
    for await (const account of results) {
      accounts.push(account);
    }

    console.log('Existing connections:', JSON.stringify(accounts, null, 2));

    return {
      success: true,
      accounts,
      total: accounts.length,
    };
  } catch (error) {
    console.error("Error getting existing connections:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get existing connections",
      accounts: [],
    };
  }
}

/**
 * Delete a connected account for a client
 * @param clientId - The client ID (for authorization)
 * @param accountId - The Pipedream account ID to delete
 */
export async function deleteAccount(clientId: string, accountId: string) {
  try {
    const { client } = await authorizedToAccessClient(clientId);

    if (!client?.id) {
      return {
        success: false,
        error: "Client not found or unauthorized",
      };
    }

    // Check for required environment variables
    if (!process.env.PIPEDREAM_CLIENT_ID || !process.env.PIPEDREAM_CLIENT_SECRET || !process.env.PIPEDREAM_PROJECT_ID) {
      console.error("Missing Pipedream credentials");
      return {
        success: false,
        error: "Pipedream credentials not configured",
      };
    }

    console.log(`Deleting account ${accountId} for client ${client.id}`);

    // Delete the account
    await pipedreamClient.accounts.delete(accountId);

    console.log(`Successfully deleted account ${accountId}`);

    return {
      success: true,
      message: "Account disconnected successfully",
    };
  } catch (error) {
    console.error("Error deleting account:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete account",
    };
  }
}

export async function getAppAccounts(appSlug: string, clientId?: string) {
  try {
    const { client } = await authorizedToAccessClient(clientId);

    if (!client?.id) {
      return {
        success: false,
        error: "Client not found or unauthorized",
        accounts: [],
      };
    }

    // Check for required environment variables
    if (!process.env.PIPEDREAM_CLIENT_ID || !process.env.PIPEDREAM_CLIENT_SECRET || !process.env.PIPEDREAM_PROJECT_ID) {
      console.error("Missing Pipedream credentials");
      return {
        success: false,
        error: "Pipedream credentials not configured",
        accounts: [],
      };
    }

    const results = await pipedreamClient.accounts.list({
      externalUserId: client.id,
      includeCredentials: false, // We don't need to expose credentials
      app: appSlug,
    });

    // Collect all accounts from the paginated results
    const accounts = [];
    for await (const account of results) {
      accounts.push(account);
    }

    console.log(`App accounts for ${appSlug}:`, JSON.stringify(accounts, null, 2));

    return {
      success: true,
      accounts,
      total: accounts.length,
    };
  } catch (error) {
    console.error("Error getting app accounts:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get app accounts",
      accounts: [],
    };
  }
}


export async function getAppActions(appSlug: string, query?: string, clientId?: string) {
  try {
    const { client } = await authorizedToAccessClient(clientId);

    if (!client?.id) {
      return {
        success: false,
        error: "Client not found or unauthorized",
        actions: [],
      };
    }

    // Check for required environment variables
    if (!process.env.PIPEDREAM_CLIENT_ID || !process.env.PIPEDREAM_CLIENT_SECRET || !process.env.PIPEDREAM_PROJECT_ID) {
      console.error("Missing Pipedream credentials");
      return {
        success: false,
        error: "Pipedream credentials not configured",
        actions: [],
      };
    }

    // If no query, load all actions (increase limit)
    // If query provided, use it for server-side search
    const results = await pipedreamClient.actions.list({
      app: appSlug,
      q: query,
      limit: query ? 50 : 200, // Load more actions when no search query
    });

    console.log(`App actions for ${appSlug}:`, JSON.stringify(results.data, null, 2));

    return {
      success: true,
      actions: results.data || [],
      total: results.data?.length || 0,
    };
  } catch (error) {
    console.error("Error getting app actions:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get app actions",
      actions: [],
    };
  }
}

/**
 * Configure a component prop to retrieve remote options
 * This is used for props with remoteOptions: true
 */
export async function configureComponentProps(
  clientId: string,
  componentId: string, 
  propName: string, 
  configuredProps: any,
  query?: string
) {
  try {
    const { client } = await authorizedToAccessClient(clientId);

    if (!client?.id) {
      return {
        success: false,
        error: "Client not found or unauthorized",
        options: [],
      };
    }

    // Check for required environment variables
    if (!process.env.PIPEDREAM_CLIENT_ID || !process.env.PIPEDREAM_CLIENT_SECRET || !process.env.PIPEDREAM_PROJECT_ID) {
      console.error("Missing Pipedream credentials");
      return {
        success: false,
        error: "Pipedream credentials not configured",
        options: [],
      };
    }

    console.log(`Configuring prop ${propName} for component ${componentId}`);
    console.log('Configured props:', JSON.stringify(configuredProps, null, 2));
    console.log('Query:', query);

    console.log('client.id', client.id)

    // Call Pipedream's configure API
    const configureParams: any = {
      externalUserId: client.id,
      id: componentId,
      propName: propName,
      configuredProps: configuredProps,
    };

    // Add query parameter if provided
    if (query) {
      configureParams.query = query;
    }

    console.log('configureParams', JSON.stringify(configureParams, null, 2));

    const response = await pipedreamClient.actions.configureProp(configureParams);

    console.log('Configure response:', JSON.stringify(response, null, 2));

    return {
      success: true,
      options: response.options || [],
      stringOptions: response.stringOptions || null,
      context: response.context || null,
      errors: response.errors || [],
    };
  } catch (error) {
    console.error("Error configuring component props:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to configure component props",
      options: [],
    };
  }
}

/**
 * Execute a Pipedream action with the provided configuration
 * @param clientId - The client ID (external user ID for Pipedream)
 * @param actionComponentId - The Pipedream action component ID
 * @param configuredProps - The merged parameters (AI params + static config)
 */
export async function executeAction(
  clientId: string,
  actionComponentId: string,
  configuredProps: Record<string, any>
) {
  try {
    // Check for required environment variables
    if (!process.env.PIPEDREAM_CLIENT_ID || !process.env.PIPEDREAM_CLIENT_SECRET || !process.env.PIPEDREAM_PROJECT_ID) {
      console.error("Missing Pipedream credentials");
      return {
        success: false,
        error: "Pipedream credentials not configured",
      };
    }

    console.log('🚀 Executing Pipedream action:', {
      clientId,
      actionComponentId,
      configuredProps,
    });

    // Execute the action using the Pipedream SDK
    const response = await pipedreamClient.actions.run({
      id: actionComponentId,
      externalUserId: clientId,
      configuredProps: configuredProps,
    });

    console.log('✅ Action executed successfully:', JSON.stringify(response, null, 2));

    return {
      success: true,
      exports: response.exports,
      logs: response.os,
      returnValue: response.ret,
    };
  } catch (error) {
    console.error("❌ Error executing action:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to execute action",
    };
  }
}
