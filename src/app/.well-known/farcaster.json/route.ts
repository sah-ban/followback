export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL;

  const config = {
    accountAssociation: {
      header:"eyJmaWQiOjI2ODQzOCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDIxODA4RUUzMjBlREY2NGMwMTlBNmJiMEY3RTRiRkIzZDYyRjA2RWMifQ",
      payload: "eyJkb21haW4iOiJmb2xsb3ctYmFjay1jaGVja2VyLnZlcmNlbC5hcHAifQ",
      signature:"MHhiYjc1YjUxODBhNTE3ODNiZjAzZDVjNjVkYWI3YTQ3ZjBiMWE1ZmVmOTI0OTU2OWVmYTI5NTk0Y2UzMzkxOTZjMDg4YTIyMGQ4MTNlNDNjNGI5YmU3ZmEyMzU3NjY5ODQ5OGVmNDM2ZDk4NmNmMjc4ODMwZGY0NGZiOTRjMDg0ZTFi",
    },
    frame: {
      version: "1",
      name: "FollowBack",
      iconUrl: `${appUrl}/icon.png`,
      homeUrl: appUrl,
      buttonTitle: "FollowBack",
      splashImageUrl: `${appUrl}/icon.png`,
      splashBackgroundColor: "#FFFFFF",
    },
  };

  return Response.json(config);
}
