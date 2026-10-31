import '../models/client.dart';
import '../models/property.dart';

/// Normalises a money amount to PKR so budgets and prices can be compared.
double toPkr(double value, String unit) => switch (unit) {
      'Thousand Per Month' => value * 1000,
      'Lakh' => value * 100000,
      'Lakh Per Month' => value * 100000,
      'Crore' => value * 10000000,
      _ => value,
    };

/// True when the client can afford the property.
bool budgetCovers(Client client, Property property) {
  return toPkr(client.budget, client.budgetUnit) >= toPkr(property.price, property.priceUnit);
}

/// True when the client's bedroom requirement matches the property.
bool bedroomsMatch(Client client, Property property) {
  if (client.bedrooms == property.bedrooms) return true;
  if (client.bedrooms == 'Custom' || property.bedrooms == 'Custom') return true;
  final clientBeds = _bedroomCount(client.resolvedBedrooms);
  final propertyBeds = _bedroomCount(property.resolvedBedrooms);
  if (clientBeds == null || propertyBeds == null) return true;
  return clientBeds == propertyBeds;
}

int? _bedroomCount(String label) {
  final match = RegExp(r'^(\d+)').firstMatch(label.trim());
  return match == null ? null : int.tryParse(match.group(1)!);
}

/// Clients that match a property's type, purpose, size and budget.
List<Client> matchClientsForProperty(Property property, List<Client> clients) {
  return clients.where((client) {
    if (client.type != property.type) return false;
    final purposeMatches =
        (property.isForRent && client.wantsToRent) || (property.isForSale && client.wantsToBuy);
    if (!purposeMatches) return false;
    if (!bedroomsMatch(client, property)) return false;
    return budgetCovers(client, property);
  }).toList();
}

/// Properties that match a client's type, purpose, size and budget.
List<Property> matchPropertiesForClient(Client client, List<Property> properties) {
  return properties.where((property) {
    if (property.type != client.type) return false;
    final purposeMatches =
        (property.isForRent && client.wantsToRent) || (property.isForSale && client.wantsToBuy);
    if (!purposeMatches) return false;
    if (!bedroomsMatch(client, property)) return false;
    return budgetCovers(client, property);
  }).toList();
}
