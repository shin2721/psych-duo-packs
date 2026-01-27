/**
 * Analytics Debug Route
 * 
 * DEV only - renders nothing in Release builds.
 */

import AnalyticsDebug from '../../components/AnalyticsDebug';

export default function AnalyticsDebugRoute() {
    // Release guard handled by component
    return <AnalyticsDebug />;
}
