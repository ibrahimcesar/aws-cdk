"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCompleteHandler = exports.onEventHandler = void 0;
/* eslint-disable no-console */
const aws_sdk_1 = require("aws-sdk"); // eslint-disable-line import/no-extraneous-dependencies
async function onEventHandler(event) {
    console.log('Event: %j', { ...event, ResponseURL: '...' });
    const dynamodb = new aws_sdk_1.DynamoDB();
    const tableName = event.ResourceProperties.TableName;
    const region = event.ResourceProperties.Region;
    let updateTableAction;
    if (event.RequestType === 'Create' || event.RequestType === 'Delete') {
        updateTableAction = event.RequestType;
    }
    else { // Update
        // There are two cases where an Update can happen:
        // 1. A table replacement. In that case, we need to create the replica in the new Table
        // (the replica for the "old" Table will be deleted when CFN issues a Delete event on the old physical resource id).
        // 2. A customer has changed one of the properties of the Custom Resource,
        // like 'waitForReplicationToFinish'. In that case, we don't have to do anything.
        // To differentiate the two cases, we make an API call to DynamoDB to check whether a replica already exists.
        const describeTableResult = await dynamodb.describeTable({
            TableName: tableName,
        }).promise();
        console.log('Describe table: %j', describeTableResult);
        const replicaExists = describeTableResult.Table?.Replicas?.some(replica => replica.RegionName === region);
        updateTableAction = replicaExists ? undefined : 'Create';
    }
    if (updateTableAction) {
        const data = await dynamodb.updateTable({
            TableName: tableName,
            ReplicaUpdates: [
                {
                    [updateTableAction]: {
                        RegionName: region,
                    },
                },
            ],
        }).promise();
        console.log('Update table: %j', data);
    }
    else {
        console.log("Skipping updating Table, as a replica in '%s' already exists", region);
    }
    return event.RequestType === 'Create' || event.RequestType === 'Update'
        ? { PhysicalResourceId: `${tableName}-${region}` }
        : {};
}
exports.onEventHandler = onEventHandler;
async function isCompleteHandler(event) {
    console.log('Event: %j', { ...event, ResponseURL: '...' });
    const dynamodb = new aws_sdk_1.DynamoDB();
    const data = await dynamodb.describeTable({
        TableName: event.ResourceProperties.TableName,
    }).promise();
    console.log('Describe table: %j', data);
    const tableActive = data.Table?.TableStatus === 'ACTIVE';
    const replicas = data.Table?.Replicas ?? [];
    const regionReplica = replicas.find(r => r.RegionName === event.ResourceProperties.Region);
    const replicaActive = regionReplica?.ReplicaStatus === 'ACTIVE';
    const skipReplicationCompletedWait = event.ResourceProperties.SkipReplicationCompletedWait === 'true';
    switch (event.RequestType) {
        case 'Create':
        case 'Update':
            // Complete when replica is reported as ACTIVE
            return { IsComplete: tableActive && (replicaActive || skipReplicationCompletedWait) };
        case 'Delete':
            // Complete when replica is gone
            return { IsComplete: tableActive && regionReplica === undefined };
    }
}
exports.isCompleteHandler = isCompleteHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwrQkFBK0I7QUFDL0IscUNBQW1DLENBQUMsd0RBQXdEO0FBR3JGLEtBQUssVUFBVSxjQUFjLENBQUMsS0FBcUI7SUFDeEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsRUFBRSxHQUFHLEtBQUssRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUUzRCxNQUFNLFFBQVEsR0FBRyxJQUFJLGtCQUFRLEVBQUUsQ0FBQztJQUVoQyxNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsa0JBQWtCLENBQUMsU0FBUyxDQUFDO0lBQ3JELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUM7SUFFL0MsSUFBSSxpQkFBNkQsQ0FBQztJQUNsRSxJQUFJLEtBQUssQ0FBQyxXQUFXLEtBQUssUUFBUSxJQUFJLEtBQUssQ0FBQyxXQUFXLEtBQUssUUFBUSxFQUFFO1FBQ3BFLGlCQUFpQixHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUM7S0FDdkM7U0FBTSxFQUFFLFNBQVM7UUFDaEIsa0RBQWtEO1FBQ2xELHVGQUF1RjtRQUN2RixvSEFBb0g7UUFDcEgsMEVBQTBFO1FBQzFFLGlGQUFpRjtRQUNqRiw2R0FBNkc7UUFDN0csTUFBTSxtQkFBbUIsR0FBRyxNQUFNLFFBQVEsQ0FBQyxhQUFhLENBQUM7WUFDdkQsU0FBUyxFQUFFLFNBQVM7U0FDckIsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1FBQ3ZELE1BQU0sYUFBYSxHQUFHLG1CQUFtQixDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLFVBQVUsS0FBSyxNQUFNLENBQUMsQ0FBQztRQUMxRyxpQkFBaUIsR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO0tBQzFEO0lBRUQsSUFBSSxpQkFBaUIsRUFBRTtRQUNyQixNQUFNLElBQUksR0FBRyxNQUFNLFFBQVEsQ0FBQyxXQUFXLENBQUM7WUFDdEMsU0FBUyxFQUFFLFNBQVM7WUFDcEIsY0FBYyxFQUFFO2dCQUNkO29CQUNFLENBQUMsaUJBQWlCLENBQUMsRUFBRTt3QkFDbkIsVUFBVSxFQUFFLE1BQU07cUJBQ25CO2lCQUNGO2FBQ0Y7U0FDRixDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDYixPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxDQUFDO0tBQ3ZDO1NBQU07UUFDTCxPQUFPLENBQUMsR0FBRyxDQUFDLDhEQUE4RCxFQUFFLE1BQU0sQ0FBQyxDQUFDO0tBQ3JGO0lBRUQsT0FBTyxLQUFLLENBQUMsV0FBVyxLQUFLLFFBQVEsSUFBSSxLQUFLLENBQUMsV0FBVyxLQUFLLFFBQVE7UUFDckUsQ0FBQyxDQUFDLEVBQUUsa0JBQWtCLEVBQUUsR0FBRyxTQUFTLElBQUksTUFBTSxFQUFFLEVBQUU7UUFDbEQsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUNULENBQUM7QUE3Q0Qsd0NBNkNDO0FBRU0sS0FBSyxVQUFVLGlCQUFpQixDQUFDLEtBQXdCO0lBQzlELE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLEVBQUUsR0FBRyxLQUFLLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7SUFFM0QsTUFBTSxRQUFRLEdBQUcsSUFBSSxrQkFBUSxFQUFFLENBQUM7SUFFaEMsTUFBTSxJQUFJLEdBQUcsTUFBTSxRQUFRLENBQUMsYUFBYSxDQUFDO1FBQ3hDLFNBQVMsRUFBRSxLQUFLLENBQUMsa0JBQWtCLENBQUMsU0FBUztLQUM5QyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDYixPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxDQUFDO0lBRXhDLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsV0FBVyxLQUFLLFFBQVEsQ0FBQztJQUN6RCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLFFBQVEsSUFBSSxFQUFFLENBQUM7SUFDNUMsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLEtBQUssS0FBSyxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzNGLE1BQU0sYUFBYSxHQUFHLGFBQWEsRUFBRSxhQUFhLEtBQUssUUFBUSxDQUFDO0lBQ2hFLE1BQU0sNEJBQTRCLEdBQUcsS0FBSyxDQUFDLGtCQUFrQixDQUFDLDRCQUE0QixLQUFLLE1BQU0sQ0FBQztJQUV0RyxRQUFRLEtBQUssQ0FBQyxXQUFXLEVBQUU7UUFDekIsS0FBSyxRQUFRLENBQUM7UUFDZCxLQUFLLFFBQVE7WUFDWCw4Q0FBOEM7WUFDOUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxXQUFXLElBQUksQ0FBQyxhQUFhLElBQUksNEJBQTRCLENBQUMsRUFBRSxDQUFDO1FBQ3hGLEtBQUssUUFBUTtZQUNYLGdDQUFnQztZQUNoQyxPQUFPLEVBQUUsVUFBVSxFQUFFLFdBQVcsSUFBSSxhQUFhLEtBQUssU0FBUyxFQUFFLENBQUM7S0FDckU7QUFDSCxDQUFDO0FBekJELDhDQXlCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnNvbGUgKi9cbmltcG9ydCB7IER5bmFtb0RCIH0gZnJvbSAnYXdzLXNkayc7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgaW1wb3J0L25vLWV4dHJhbmVvdXMtZGVwZW5kZW5jaWVzXG5pbXBvcnQgdHlwZSB7IElzQ29tcGxldGVSZXF1ZXN0LCBJc0NvbXBsZXRlUmVzcG9uc2UsIE9uRXZlbnRSZXF1ZXN0LCBPbkV2ZW50UmVzcG9uc2UgfSBmcm9tICcuLi8uLi8uLi9jdXN0b20tcmVzb3VyY2VzL2xpYi9wcm92aWRlci1mcmFtZXdvcmsvdHlwZXMnO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb25FdmVudEhhbmRsZXIoZXZlbnQ6IE9uRXZlbnRSZXF1ZXN0KTogUHJvbWlzZTxPbkV2ZW50UmVzcG9uc2U+IHtcbiAgY29uc29sZS5sb2coJ0V2ZW50OiAlaicsIHsgLi4uZXZlbnQsIFJlc3BvbnNlVVJMOiAnLi4uJyB9KTtcblxuICBjb25zdCBkeW5hbW9kYiA9IG5ldyBEeW5hbW9EQigpO1xuXG4gIGNvbnN0IHRhYmxlTmFtZSA9IGV2ZW50LlJlc291cmNlUHJvcGVydGllcy5UYWJsZU5hbWU7XG4gIGNvbnN0IHJlZ2lvbiA9IGV2ZW50LlJlc291cmNlUHJvcGVydGllcy5SZWdpb247XG5cbiAgbGV0IHVwZGF0ZVRhYmxlQWN0aW9uOiAnQ3JlYXRlJyB8ICdVcGRhdGUnIHwgJ0RlbGV0ZScgfCB1bmRlZmluZWQ7XG4gIGlmIChldmVudC5SZXF1ZXN0VHlwZSA9PT0gJ0NyZWF0ZScgfHwgZXZlbnQuUmVxdWVzdFR5cGUgPT09ICdEZWxldGUnKSB7XG4gICAgdXBkYXRlVGFibGVBY3Rpb24gPSBldmVudC5SZXF1ZXN0VHlwZTtcbiAgfSBlbHNlIHsgLy8gVXBkYXRlXG4gICAgLy8gVGhlcmUgYXJlIHR3byBjYXNlcyB3aGVyZSBhbiBVcGRhdGUgY2FuIGhhcHBlbjpcbiAgICAvLyAxLiBBIHRhYmxlIHJlcGxhY2VtZW50LiBJbiB0aGF0IGNhc2UsIHdlIG5lZWQgdG8gY3JlYXRlIHRoZSByZXBsaWNhIGluIHRoZSBuZXcgVGFibGVcbiAgICAvLyAodGhlIHJlcGxpY2EgZm9yIHRoZSBcIm9sZFwiIFRhYmxlIHdpbGwgYmUgZGVsZXRlZCB3aGVuIENGTiBpc3N1ZXMgYSBEZWxldGUgZXZlbnQgb24gdGhlIG9sZCBwaHlzaWNhbCByZXNvdXJjZSBpZCkuXG4gICAgLy8gMi4gQSBjdXN0b21lciBoYXMgY2hhbmdlZCBvbmUgb2YgdGhlIHByb3BlcnRpZXMgb2YgdGhlIEN1c3RvbSBSZXNvdXJjZSxcbiAgICAvLyBsaWtlICd3YWl0Rm9yUmVwbGljYXRpb25Ub0ZpbmlzaCcuIEluIHRoYXQgY2FzZSwgd2UgZG9uJ3QgaGF2ZSB0byBkbyBhbnl0aGluZy5cbiAgICAvLyBUbyBkaWZmZXJlbnRpYXRlIHRoZSB0d28gY2FzZXMsIHdlIG1ha2UgYW4gQVBJIGNhbGwgdG8gRHluYW1vREIgdG8gY2hlY2sgd2hldGhlciBhIHJlcGxpY2EgYWxyZWFkeSBleGlzdHMuXG4gICAgY29uc3QgZGVzY3JpYmVUYWJsZVJlc3VsdCA9IGF3YWl0IGR5bmFtb2RiLmRlc2NyaWJlVGFibGUoe1xuICAgICAgVGFibGVOYW1lOiB0YWJsZU5hbWUsXG4gICAgfSkucHJvbWlzZSgpO1xuICAgIGNvbnNvbGUubG9nKCdEZXNjcmliZSB0YWJsZTogJWonLCBkZXNjcmliZVRhYmxlUmVzdWx0KTtcbiAgICBjb25zdCByZXBsaWNhRXhpc3RzID0gZGVzY3JpYmVUYWJsZVJlc3VsdC5UYWJsZT8uUmVwbGljYXM/LnNvbWUocmVwbGljYSA9PiByZXBsaWNhLlJlZ2lvbk5hbWUgPT09IHJlZ2lvbik7XG4gICAgdXBkYXRlVGFibGVBY3Rpb24gPSByZXBsaWNhRXhpc3RzID8gdW5kZWZpbmVkIDogJ0NyZWF0ZSc7XG4gIH1cblxuICBpZiAodXBkYXRlVGFibGVBY3Rpb24pIHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZHluYW1vZGIudXBkYXRlVGFibGUoe1xuICAgICAgVGFibGVOYW1lOiB0YWJsZU5hbWUsXG4gICAgICBSZXBsaWNhVXBkYXRlczogW1xuICAgICAgICB7XG4gICAgICAgICAgW3VwZGF0ZVRhYmxlQWN0aW9uXToge1xuICAgICAgICAgICAgUmVnaW9uTmFtZTogcmVnaW9uLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pLnByb21pc2UoKTtcbiAgICBjb25zb2xlLmxvZygnVXBkYXRlIHRhYmxlOiAlaicsIGRhdGEpO1xuICB9IGVsc2Uge1xuICAgIGNvbnNvbGUubG9nKFwiU2tpcHBpbmcgdXBkYXRpbmcgVGFibGUsIGFzIGEgcmVwbGljYSBpbiAnJXMnIGFscmVhZHkgZXhpc3RzXCIsIHJlZ2lvbik7XG4gIH1cblxuICByZXR1cm4gZXZlbnQuUmVxdWVzdFR5cGUgPT09ICdDcmVhdGUnIHx8IGV2ZW50LlJlcXVlc3RUeXBlID09PSAnVXBkYXRlJ1xuICAgID8geyBQaHlzaWNhbFJlc291cmNlSWQ6IGAke3RhYmxlTmFtZX0tJHtyZWdpb259YCB9XG4gICAgOiB7fTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGlzQ29tcGxldGVIYW5kbGVyKGV2ZW50OiBJc0NvbXBsZXRlUmVxdWVzdCk6IFByb21pc2U8SXNDb21wbGV0ZVJlc3BvbnNlPiB7XG4gIGNvbnNvbGUubG9nKCdFdmVudDogJWonLCB7IC4uLmV2ZW50LCBSZXNwb25zZVVSTDogJy4uLicgfSk7XG5cbiAgY29uc3QgZHluYW1vZGIgPSBuZXcgRHluYW1vREIoKTtcblxuICBjb25zdCBkYXRhID0gYXdhaXQgZHluYW1vZGIuZGVzY3JpYmVUYWJsZSh7XG4gICAgVGFibGVOYW1lOiBldmVudC5SZXNvdXJjZVByb3BlcnRpZXMuVGFibGVOYW1lLFxuICB9KS5wcm9taXNlKCk7XG4gIGNvbnNvbGUubG9nKCdEZXNjcmliZSB0YWJsZTogJWonLCBkYXRhKTtcblxuICBjb25zdCB0YWJsZUFjdGl2ZSA9IGRhdGEuVGFibGU/LlRhYmxlU3RhdHVzID09PSAnQUNUSVZFJztcbiAgY29uc3QgcmVwbGljYXMgPSBkYXRhLlRhYmxlPy5SZXBsaWNhcyA/PyBbXTtcbiAgY29uc3QgcmVnaW9uUmVwbGljYSA9IHJlcGxpY2FzLmZpbmQociA9PiByLlJlZ2lvbk5hbWUgPT09IGV2ZW50LlJlc291cmNlUHJvcGVydGllcy5SZWdpb24pO1xuICBjb25zdCByZXBsaWNhQWN0aXZlID0gcmVnaW9uUmVwbGljYT8uUmVwbGljYVN0YXR1cyA9PT0gJ0FDVElWRSc7XG4gIGNvbnN0IHNraXBSZXBsaWNhdGlvbkNvbXBsZXRlZFdhaXQgPSBldmVudC5SZXNvdXJjZVByb3BlcnRpZXMuU2tpcFJlcGxpY2F0aW9uQ29tcGxldGVkV2FpdCA9PT0gJ3RydWUnO1xuXG4gIHN3aXRjaCAoZXZlbnQuUmVxdWVzdFR5cGUpIHtcbiAgICBjYXNlICdDcmVhdGUnOlxuICAgIGNhc2UgJ1VwZGF0ZSc6XG4gICAgICAvLyBDb21wbGV0ZSB3aGVuIHJlcGxpY2EgaXMgcmVwb3J0ZWQgYXMgQUNUSVZFXG4gICAgICByZXR1cm4geyBJc0NvbXBsZXRlOiB0YWJsZUFjdGl2ZSAmJiAocmVwbGljYUFjdGl2ZSB8fCBza2lwUmVwbGljYXRpb25Db21wbGV0ZWRXYWl0KSB9O1xuICAgIGNhc2UgJ0RlbGV0ZSc6XG4gICAgICAvLyBDb21wbGV0ZSB3aGVuIHJlcGxpY2EgaXMgZ29uZVxuICAgICAgcmV0dXJuIHsgSXNDb21wbGV0ZTogdGFibGVBY3RpdmUgJiYgcmVnaW9uUmVwbGljYSA9PT0gdW5kZWZpbmVkIH07XG4gIH1cbn1cbiJdfQ==