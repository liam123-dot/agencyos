import { createServiceClient } from "@/lib/supabase/server"

/**
 * Checks if the current time matches any active routing rules
 * @param routingRules - Array of routing rules for the agent
 * @returns The phone number to route to, or null if no rules match
 */
function getActiveRoutingRuleNumber(routingRules: any[]): string | null {
    if (!routingRules || routingRules.length === 0) {
        return null;
    }

    // Get current time and day
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue, etc.
    const currentTime = now.toTimeString().slice(0, 8); // HH:MM:SS format

    console.log(`[ROUTING_CHECK] Current time: ${currentTime}, day: ${currentDay}`);

    // Filter enabled rules that match the current day
    const applicableRules = routingRules.filter(rule => {
        if (!rule.enabled) {
            console.log(`[ROUTING_CHECK] Rule '${rule.name}' is disabled, skipping`);
            return false;
        }

        if (!rule.days || !rule.days.includes(currentDay)) {
            console.log(`[ROUTING_CHECK] Rule '${rule.name}' doesn't apply to ${currentDay}`);
            return false;
        }

        return true;
    });

    console.log(`[ROUTING_CHECK] Found ${applicableRules.length} applicable rules for ${currentDay}`);

    // Check each applicable rule to see if current time falls within its range
    for (const rule of applicableRules) {
        const startTime = rule.start_time; // Already in HH:MM:SS format from database
        const endTime = rule.end_time;     // Already in HH:MM:SS format from database

        console.log(`[ROUTING_CHECK] Checking rule '${rule.name}': ${startTime} - ${endTime}`);

        // Compare times as strings (works because of HH:MM:SS format)
        if (currentTime >= startTime && currentTime <= endTime) {
            console.log(`[ROUTING_CHECK] Current time ${currentTime} matches rule '${rule.name}', routing to ${rule.route_to}`);
            return rule.route_to;
        } else {
            console.log(`[ROUTING_CHECK] Current time ${currentTime} outside rule '${rule.name}' range (${startTime} - ${endTime})`);
        }
    }

    console.log(`[ROUTING_CHECK] No routing rules match current time, will use default agent routing`);
    return null;
}

export async function POST(request: Request, { params }: { params: Promise<{ numberid: string }> }) {

    const { numberid } = await params
    const data = await request.json()

    const supabaseServerClient = await createServiceClient()

    const { data: phoneNumber, error: phoneNumberError } = await supabaseServerClient
        .from('phone_numbers')
        .select('*')
        .eq('id', numberid)
        .single();

    console.log('[WEBHOOK] Phone number:', phoneNumber, phoneNumberError)

    const { data: agent, error: agentError } = await supabaseServerClient
        .from('agents')
        .select('*')
        .eq('id', phoneNumber.agent_id)
        .single();

    if (agentError || !agent) {
        throw new Error('Agent not found');
    }

    console.log('[WEBHOOK] Agent:', agent, agentError)

    const { data: routingRules, error: routingRulesError } = await supabaseServerClient
        .from('agent_routing_rules')
        .select('*')
        .eq('agent_id', agent.id)
        .eq('enabled', true)
        .order('created_at', { ascending: true }); // Order by creation time for consistent priority

    
    let body: any = {
        assistantId: agent.platform_id
    }

    if (routingRules && routingRules.length > 0) {

        // Check if any routing rules are active for the current time
        const activeRoutingNumber = getActiveRoutingRuleNumber(routingRules);

        if (activeRoutingNumber) {
            console.log(`[WEBHOOK] Active routing rule found, forwarding call to: ${activeRoutingNumber}`);
            body = {
                destination: {
                    type: 'number',
                    number: activeRoutingNumber
                }
            }
        } 
    }

    return new Response(JSON.stringify(body), { status: 200 })
}