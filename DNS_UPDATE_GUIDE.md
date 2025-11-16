# DNS UPDATE REQUIRED

## CURRENT ISSUE
Firebase ACME challenge failing because DNS still points to old hosting (136.110.138.66)

## REQUIRED DNS CHANGES

### DELETE OLD RECORD:
Type: A
Name: sapphiretrade.xyz  
Value: 136.110.138.66

### ADD NEW RECORDS:
Type: A  
Name: sapphiretrade.xyz
Value: 199.36.158.100

Type: TXT
Name: sapphiretrade.xyz  
Value: hosting-site=sapphiretrade

## VERIFICATION
After DNS updates, Firebase will automatically verify and provision SSL certificate.

